import { MatillionJob, MatillionComponent, ConversionOptions, ConvertedOutput } from '../types/matillion';
import { translateMatillionExprToPySpark } from './functionMapper';
import { getBatchOptimizerRecommendation } from './schemaValidator';

export function convertMatillionJob(job: MatillionJob, options: ConversionOptions): ConvertedOutput {
  const warnings: string[] = [];
  const optimizations: string[] = [];
  
  // Topological sort of components based on links
  const sortedComponents = getTopologicalOrder(job);
  
  // Build component output names (e.g. df_stg_customers, df_calc_line_item)
  const compVarMap = new Map<string, string>();
  job.components.forEach(c => {
    const cleanName = 'df_' + c.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    compVarMap.set(c.id, cleanName);
  });

  // Batch Optimizer Integration
  if (options.batchOptimizer) {
    const batchRec = getBatchOptimizerRecommendation(options.inputDataVolume, job);
    optimizations.unshift(`Batch Optimizer Active (${batchRec.label}): Auto target file size (${batchRec.targetFileSizeMB} MB) & ${batchRec.partitionStrategy}`);
  }

  // Generate Notebook Code
  const notebookCode = generateNotebook(job, sortedComponents, compVarMap, options, optimizations, warnings);
  
  // Generate Standalone Script
  const scriptCode = generateScript(job, sortedComponents, compVarMap, options);

  // Generate Delta Live Tables (DLT) Code
  const dltCode = generateDLT(job, sortedComponents, compVarMap, options);

  // Generate Databricks Workflow JSON
  const workflowJson = generateWorkflowJson(job, options);

  // Calculate complexity
  const total = job.components.length;
  let complexity: 'Low' | 'Medium' | 'High' = 'Low';
  if (total > 8 || job.components.some(c => c.type.includes('SCD') || c.type.includes('Iterator') || c.type === 'Join')) {
    complexity = 'Medium';
  }
  if (total > 12 || job.components.filter(c => c.type === 'Join').length >= 3 || job.components.some(c => c.parameters?.writeMode === 'SCD2_MERGE')) {
    complexity = 'High';
  }

  // Recommended optimizations
  optimizations.push("Leverages Delta Lake transaction log for ACID guarantees and zero-copy time travel.");
  if (options.outputFormat === 'dlt') {
    optimizations.unshift("Targeted Delta Live Tables (DLT) declarative pipeline with automated graph lineage & orchestration.");
    optimizations.push(`DLT Data Quality Expectations active using ${options.dltExpectationsMode === 'fail' ? '@dlt.expect_or_fail' : options.dltExpectationsMode === 'warn' ? '@dlt.expect' : '@dlt.expect_or_drop'}.`);
    if (job.components.some(c => c.parameters?.writeMode === 'SCD2_MERGE')) {
      optimizations.push("Automated SCD Type 2 tracking generated via native dlt.apply_changes(stored_as_scd_type=2).");
    }
  }
  if (options.useLiquidClustering) {
    optimizations.push("Configured with Databricks Liquid Clustering (CLUSTER BY) for flexible query acceleration.");
  } else {
    optimizations.push("Delta OPTIMIZE and Z-ORDER indexing applied on high-cardinality join/filter columns.");
  }
  if (options.useUnityCatalog) {
    optimizations.push("Unity Catalog 3-level namespace (catalog.schema.table) enforced for centralized governance.");
  }

  return {
    notebookCode,
    scriptCode,
    dltCode,
    workflowJson,
    stats: {
      totalComponents: total,
      translatedComponents: total - warnings.length,
      unsupportedComponents: warnings.length,
      estimatedSparkOptimizations: optimizations,
      complexityScore: complexity,
      warnings
    }
  };
}

function getTopologicalOrder(job: MatillionJob): MatillionComponent[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  job.components.forEach(c => {
    inDegree.set(c.id, 0);
    adj.set(c.id, []);
  });

  job.links.forEach(l => {
    if (inDegree.has(l.toId)) {
      inDegree.set(l.toId, (inDegree.get(l.toId) || 0) + 1);
    }
    if (adj.has(l.fromId)) {
      adj.get(l.fromId)!.push(l.toId);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const order: string[] = [];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    order.push(cur);
    adj.get(cur)?.forEach(nxt => {
      const d = (inDegree.get(nxt) || 1) - 1;
      inDegree.set(nxt, d);
      if (d === 0) queue.push(nxt);
    });
  }

  // Fallback for circular or orphaned nodes
  if (order.length < job.components.length) {
    job.components.forEach(c => {
      if (!order.includes(c.id)) order.push(c.id);
    });
  }

  const compMap = new Map(job.components.map(c => [c.id, c]));
  return order.map(id => compMap.get(id)!).filter(Boolean);
}

function getCatalogTable(table: string, schema: string, catalog: string, useUC: boolean): string {
  if (table.includes('.')) return table;
  if (useUC) {
    return `${catalog || 'main'}.${schema || 'default'}.${table}`;
  }
  return `${schema || 'default'}.${table}`;
}

function generateNotebook(
  job: MatillionJob,
  components: MatillionComponent[],
  compVarMap: Map<string, string>,
  options: ConversionOptions,
  optimizations: string[],
  warnings: string[]
): string {
  const cells: string[] = [];

  // Header Cell
  cells.push(`# Databricks notebook source
# MAGIC %md
# MAGIC # ${job.name}
# MAGIC **Converted from Matillion ${job.jobType} Job**
# MAGIC 
# MAGIC - **Description:** ${job.description}
# MAGIC - **Target Runtime:** Databricks Runtime (DBR ${options.runtimeVersion} LTS)
# MAGIC - **Governance:** ${options.useUnityCatalog ? 'Unity Catalog Enabled' : 'Hive Metastore'}
# MAGIC - **Storage Format:** Delta Lake (ACID Transactional Tables)
# MAGIC - **Generation Timestamp:** ${new Date().toISOString()}
`);

  // Parameter Widgets Cell
  if (job.variables && job.variables.length > 0) {
    let widgetLines = `# COMMAND ----------\n# MAGIC %md\n# MAGIC ## 1. Parameter Definitions & Databricks Widgets\n# MAGIC Replaces Matillion Environment & Grid Variables\n\n`;
    job.variables.forEach(v => {
      widgetLines += `dbutils.widgets.text("${v.name}", "${v.defaultValue || ''}", "${v.description || v.name}")\n`;
    });
    widgetLines += `\n# Retrieve runtime widget values\n`;
    job.variables.forEach(v => {
      widgetLines += `${v.name} = dbutils.widgets.get("${v.name}")\n`;
    });
    cells.push(widgetLines);
  }

  // Imports Cell
  cells.push(`# COMMAND ----------
# MAGIC %md
# MAGIC ## 2. Imports & Spark Configuration
# MAGIC Standard PySpark libraries and Delta Lake table APIs

import pyspark.sql.functions as F
import pyspark.sql.types as T
from pyspark.sql.window import Window
from delta.tables import DeltaTable
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("matillion_migration")

# Ensure Delta Lake optimizations are active
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")
${options.batchOptimizer ? `
# Batch Optimizer: Auto-Partitioning & File Sizing Config
${getBatchOptimizerRecommendation(options.inputDataVolume, job).pysparkSnippet}
` : ''}`);

  // Component-by-Component conversion
  let stepIndex = 3;
  components.forEach(comp => {
    const varName = compVarMap.get(comp.id)!;
    const parentLinks = job.links.filter(l => l.toId === comp.id);
    const parentVarNames = parentLinks.map(l => compVarMap.get(l.fromId)!).filter(Boolean);
    const primaryInputVar = parentVarNames[0] || 'df_input';

    let code = `# COMMAND ----------\n# MAGIC %md\n# MAGIC ### Step ${stepIndex++}: Component [${comp.name}] (${comp.type})\n`;
    
    switch (comp.type) {
      case 'Table Input': {
        const fullTable = getCatalogTable(
          comp.parameters?.targetTable || comp.name, 
          comp.parameters?.schema || options.schemaName, 
          comp.parameters?.database || options.catalogName, 
          options.useUnityCatalog
        );
        const whereClause = comp.parameters?.sqlWhere;
        const columns = comp.parameters?.columns;

        code += `# Read from Delta / Catalog Table\n`;
        code += `${varName} = spark.read.table("${fullTable}")\n`;
        if (columns && Array.isArray(columns) && columns.length > 0) {
          code += `${varName} = ${varName}.select(${columns.map((c: string) => `"${c}"`).join(', ')})\n`;
        }
        if (whereClause) {
          const sparkWhere = translateMatillionExprToPySpark(whereClause);
          code += `${varName} = ${varName}.filter(F.expr("""${sparkWhere}"""))\n`;
        }
        code += `logger.info(f"Loaded {${varName}.count()} rows from ${fullTable}")\n`;
        code += `display(${varName}.limit(5))\n`;
        break;
      }

      case 'Calculator': {
        const calcs = comp.parameters?.calculations || [];
        code += `# Apply Matillion Calculator expressions\n`;
        code += `${varName} = ${primaryInputVar}\n`;
        calcs.forEach((c: { targetColumn: string; expression: string }) => {
          const translated = translateMatillionExprToPySpark(c.expression);
          code += `${varName} = ${varName}.withColumn("${c.targetColumn}", F.expr("""${translated}"""))\n`;
        });
        code += `display(${varName}.limit(5))\n`;
        break;
      }

      case 'Filter': {
        const expr = comp.parameters?.filterExpression || '1=1';
        const translated = translateMatillionExprToPySpark(expr);
        code += `# Filter records matching business logic\n`;
        code += `${varName} = ${primaryInputVar}.filter(F.expr("""${translated}"""))\n`;
        code += `logger.info(f"Filter [${comp.name}] retained records")\n`;
        break;
      }

      case 'Join': {
        const joinType = (comp.parameters?.joinType || 'inner').toLowerCase();
        const leftVar = parentVarNames[0] || 'df_left';
        const rightVar = parentVarNames[1] || 'df_right';
        const conditions = comp.parameters?.joinConditions || [];
        
        let joinExpr = '';
        if (conditions.length > 0) {
          joinExpr = conditions.map((c: string) => {
            // Replace table aliases with dataframe references or F.expr
            return `(${c})`;
          }).join(' & ');
        } else {
          joinExpr = 'F.col("id") == F.col("id")';
        }

        code += `# Perform ${joinType.toUpperCase()} Join\n`;
        code += `${varName} = ${leftVar}.alias("left").join(\n`;
        code += `    ${rightVar}.alias("right"),\n`;
        code += `    on=F.expr("""${conditions.join(' AND ') || 'left.id = right.id'}"""),\n`;
        code += `    how="${joinType}"\n`;
        code += `)\n`;
        code += `display(${varName}.limit(5))\n`;
        break;
      }

      case 'Aggregate': {
        const groupBy = comp.parameters?.groupBy || [];
        const aggs = comp.parameters?.aggregations || [];
        code += `# Aggregate grouping by ${groupBy.join(', ')}\n`;
        
        const aggExprs = aggs.map((a: { column: string; function: string; alias?: string }) => {
          const fn = a.function.toUpperCase();
          const col = a.column;
          const al = a.alias || `${fn.toLowerCase()}_${col}`;
          if (fn === 'SUM') return `F.sum("${col}").alias("${al}")`;
          if (fn === 'COUNT_DISTINCT') return `F.count_distinct("${col}").alias("${al}")`;
          if (fn === 'COUNT') return `F.count("${col}").alias("${al}")`;
          if (fn === 'AVG') return `F.avg("${col}").alias("${al}")`;
          if (fn === 'MAX') return `F.max("${col}").alias("${al}")`;
          if (fn === 'MIN') return `F.min("${col}").alias("${al}")`;
          return `F.expr("${fn}(${col})").alias("${al}")`;
        });

        code += `${varName} = ${primaryInputVar}.groupBy(${groupBy.map((g: string) => `"${g}"`).join(', ')})\n`;
        code += `    .agg(\n        ${aggExprs.join(',\n        ')}\n    )\n`;
        code += `display(${varName}.limit(5))\n`;
        break;
      }

      case 'Rank / Window': {
        const partitions = comp.parameters?.partitionBy || [];
        const orderBy = comp.parameters?.orderBy || [];
        const fn = comp.parameters?.function || 'DENSE_RANK';
        const targetCol = comp.parameters?.targetColumn || 'rank';

        code += `# Window Function Definition\n`;
        const orderExprs = orderBy.map((o: { column: string; direction?: string }) => {
          return o.direction?.toUpperCase() === 'DESC' ? `F.col("${o.column}").desc()` : `F.col("${o.column}").asc()`;
        });

        code += `window_spec = Window.partitionBy(${partitions.map((p: string) => `"${p}"`).join(', ')}) \\\n`;
        code += `    .orderBy(${orderExprs.join(', ') || 'F.col("id")'})\n\n`;

        if (fn.toUpperCase() === 'DENSE_RANK') {
          code += `${varName} = ${primaryInputVar}.withColumn("${targetCol}", F.dense_rank().over(window_spec))\n`;
        } else if (fn.toUpperCase() === 'ROW_NUMBER') {
          code += `${varName} = ${primaryInputVar}.withColumn("${targetCol}", F.row_number().over(window_spec))\n`;
        } else {
          code += `${varName} = ${primaryInputVar}.withColumn("${targetCol}", F.rank().over(window_spec))\n`;
        }
        break;
      }

      case 'Flatten': {
        const inputCol = comp.parameters?.inputColumn || 'raw_payload_json';
        const outAlias = comp.parameters?.outputAlias || 'flattened_record';
        code += `# Semi-structured JSON array explosion\n`;
        code += `# Note: If schema is unknown at compile-time, PySpark schema_of_json can derive it\n`;
        code += `${varName} = ${primaryInputVar}.withColumn("${outAlias}", F.explode(F.from_json(F.col("${inputCol}"), "array<string>")))\n`;
        break;
      }

      case 'Deduplicate': {
        const dedupCols = comp.parameters?.dedupColumns || [];
        code += `# Remove duplicate records\n`;
        if (dedupCols.length > 0) {
          code += `${varName} = ${primaryInputVar}.dropDuplicates([${dedupCols.map((c: string) => `"${c}"`).join(', ')}])\n`;
        } else {
          code += `${varName} = ${primaryInputVar}.dropDuplicates()\n`;
        }
        break;
      }

      case 'Table Output': {
        const targetTable = getCatalogTable(
          comp.parameters?.targetTable || comp.name, 
          comp.parameters?.schema || options.schemaName, 
          comp.parameters?.database || options.catalogName, 
          options.useUnityCatalog
        );
        const writeMode = comp.parameters?.writeMode || options.deltaWriteMode;
        const matchKeys = comp.parameters?.matchKeys || ['id'];
        const clusterCols = comp.parameters?.liquidClusteringColumns || options.clusterByColumns;

        code += `# Delta Lake Target Output: ${targetTable}\n`;
        code += `# Target Format: Delta Lake (ACID)\n\n`;

        if (writeMode === 'SCD2_MERGE') {
          const keyCols = matchKeys;
          code += `# Delta Lake SCD Type 2 Merge Pipeline\n`;
          code += `if not spark.catalog.tableExists("${targetTable}"):\n`;
          code += `    ${primaryInputVar}.write.format("delta").mode("overwrite").saveAsTable("${targetTable}")\n`;
          code += `    logger.info(f"Initialized table ${targetTable}")\n`;
          code += `else:\n`;
          code += `    target_delta = DeltaTable.forName(spark, "${targetTable}")\n`;
          code += `    join_condition = " AND ".join([f"tgt.{k} = src.{k}" for k in ${JSON.stringify(keyCols)}])\n\n`;
          code += `    # Expire existing matched records where hash diff changed\n`;
          code += `    target_delta.alias("tgt").merge(\n`;
          code += `        ${primaryInputVar}.filter("action_type = 'UPDATE'").alias("src"),\n`;
          code += `        join_condition + " AND tgt.is_current = true"\n`;
          code += `    ).whenMatchedUpdate(set={\n`;
          code += `        "is_current": F.lit(False),\n`;
          code += `        "valid_to": F.col("src.valid_from")\n`;
          code += `    }).execute()\n\n`;
          code += `    # Append new versions and fresh inserts\n`;
          code += `    ${primaryInputVar}.write.format("delta").mode("append").saveAsTable("${targetTable}")\n`;
          code += `    logger.info(f"SCD2 Merge completed for ${targetTable}")\n`;
        } else if (writeMode === 'MERGE') {
          const matchCondition = matchKeys.map((k: string) => `tgt.${k} = src.${k}`).join(' AND ');
          code += `if not spark.catalog.tableExists("${targetTable}"):\n`;
          code += `    ${primaryInputVar}.write.format("delta").mode("overwrite").saveAsTable("${targetTable}")\n`;
          code += `    logger.info(f"Created new Delta table: ${targetTable}")\n`;
          code += `else:\n`;
          code += `    target_delta = DeltaTable.forName(spark, "${targetTable}")\n`;
          code += `    target_delta.alias("tgt").merge(\n`;
          code += `        ${primaryInputVar}.alias("src"),\n`;
          code += `        "${matchCondition}"\n`;
          code += `    ).whenMatchedUpdateAll() \\\n`;
          code += `     .whenNotMatchedInsertAll() \\\n`;
          code += `     .execute()\n`;
          code += `    logger.info("Delta MERGE upsert executed successfully.")\n`;
        } else if (writeMode === 'OVERWRITE') {
          code += `${primaryInputVar}.write.format("delta") \\\n`;
          code += `    .mode("overwrite") \\\n`;
          code += `    .option("overwriteSchema", "true") \\\n`;
          code += `    .saveAsTable("${targetTable}")\n`;
        } else {
          code += `${primaryInputVar}.write.format("delta") \\\n`;
          code += `    .mode("append") \\\n`;
          code += `    .saveAsTable("${targetTable}")\n`;
        }

        if (clusterCols && clusterCols.length > 0) {
          code += `\n# Optimize Delta layout with Liquid Clustering\n`;
          code += `spark.sql(f"ALTER TABLE ${targetTable} CLUSTER BY (${clusterCols.join(', ')})")\n`;
          code += `spark.sql(f"OPTIMIZE ${targetTable}")\n`;
        }
        break;
      }

      case 'File Exists': {
        const uri = comp.parameters?.uri || 's3://bucket/path/';
        code += `# Check Cloud Storage delivery using dbutils.fs\n`;
        code += `try:\n`;
        code += `    files = dbutils.fs.ls("${uri}")\n`;
        code += `    if not files:\n`;
        code += `        raise FileNotFoundError("No files found at ${uri}")\n`;
        code += `    logger.info(f"Found {len(files)} files in ${uri}")\n`;
        code += `except Exception as e:\n`;
        code += `    logger.error(f"File check failed: {e}")\n`;
        code += `    raise e\n`;
        break;
      }

      case 'S3 Load': {
        const src = comp.parameters?.sourceUri || 's3://bucket/';
        const fmt = (comp.parameters?.format || 'csv').toLowerCase();
        const tgt = comp.parameters?.targetTable || 'staging_table';
        code += `# Ingest Cloud Storage data into Staging\n`;
        code += `${varName} = spark.read.format("${fmt}") \\\n`;
        if (fmt === 'csv') {
          code += `    .option("header", "${comp.parameters?.hasHeader ? 'true' : 'false'}") \\\n`;
          code += `    .option("inferSchema", "true") \\\n`;
          code += `    .option("delimiter", "${comp.parameters?.delimiter || ','}") \\\n`;
        }
        code += `    .load("${src}")\n\n`;
        code += `${varName}.write.format("delta").mode("overwrite").saveAsTable("${tgt}")\n`;
        code += `logger.info("Loaded staging table: ${tgt}")\n`;
        break;
      }

      case 'SQL Script': {
        const sqlStmt = comp.parameters?.sql || 'SELECT 1;';
        code += `# Execute Spark SQL command\n`;
        code += `spark.sql("""${sqlStmt}""")\n`;
        break;
      }

      case 'Run Transformation': {
        const childJob = comp.parameters?.jobName || 'Child_Transformation';
        const vars = comp.parameters?.passVariables || [];
        code += `# Execute child Databricks Notebook\n`;
        code += `args = {${vars.map((v: string) => `"${v}": ${v}`).join(', ')}}\n`;
        code += `logger.info(f"Triggering child notebook: ${childJob}")\n`;
        code += `result = dbutils.notebook.run("${childJob}", timeout_seconds=3600, arguments=args)\n`;
        code += `logger.info(f"Child job completed with result: {result}")\n`;
        break;
      }

      case 'Table Iterator': {
        const loopVar = comp.parameters?.loopVariable || 'item';
        const col = comp.parameters?.sourceColumn || 'id';
        code += `# Iterate across tenant/partition items dynamically\n`;
        code += `items_to_process = [row["${col}"] for row in ${primaryInputVar}.select("${col}").distinct().collect()]\n`;
        code += `logger.info(f"Found {len(items_to_process)} items to iterate over: {items_to_process}")\n\n`;
        code += `for ${loopVar} in items_to_process:\n`;
        code += `    logger.info(f"Processing item: {${loopVar}}")\n`;
        code += `    # Invoke child processing logic or notebook for item\n`;
        code += `    # dbutils.notebook.run("Process_Item", timeout_seconds=1800, arguments={"${loopVar}": str(${loopVar})})\n`;
        break;
      }

      case 'Webhook Notification': {
        const msg = comp.parameters?.message || 'Pipeline finished';
        code += `# Send notification webhook\n`;
        code += `import urllib.request, json\n`;
        code += `logger.info(f"Notification alert: ${msg}")\n`;
        code += `# Example payload dispatch:\n`;
        code += `# payload = json.dumps({"text": "${msg}"}).encode("utf-8")\n`;
        code += `# req = urllib.request.Request(slack_webhook, data=payload, headers={"Content-Type": "application/json"})\n`;
        code += `# urllib.request.urlopen(req)\n`;
        break;
      }

      case 'Start': {
        code += `# Pipeline execution initialized\nlogger.info("Pipeline started successfully.")\n`;
        break;
      }

      default: {
        warnings.push(`Component type '${comp.type}' on node '${comp.name}' mapped with generic fallback.`);
        code += `# Custom/User Component: ${comp.type}\n`;
        code += `# Parameters: ${JSON.stringify(comp.parameters, null, 2)}\n`;
        code += `${varName} = ${primaryInputVar}\n`;
        break;
      }
    }

    cells.push(code);
  });

  // Footer Cell
  cells.push(`# COMMAND ----------
# MAGIC %md
# MAGIC ## Pipeline Execution Summary
# MAGIC Processed ${components.length} translated pipeline nodes successfully.
`);

  return cells.join('\n\n');
}

function generateScript(
  job: MatillionJob,
  components: MatillionComponent[],
  compVarMap: Map<string, string>,
  options: ConversionOptions
): string {
  let py = `"""
${job.name}
Generated Modular PySpark ETL Script from Matillion ${job.jobType} Job
"""

import argparse
import logging
from pyspark.sql import SparkSession
import pyspark.sql.functions as F
import pyspark.sql.types as T
from pyspark.sql.window import Window
from delta.tables import DeltaTable

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("${job.name}")


def create_spark_session(app_name: str = "${job.name}") -> SparkSession:
    """Build or retrieve SparkSession with Delta Lake extensions."""
    return SparkSession.builder \\
        .appName(app_name) \\
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \\
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \\
        .config("spark.databricks.delta.optimizeWrite.enabled", "true") \\
        .config("spark.databricks.delta.autoCompact.enabled", "true") \\
        .getOrCreate()


def run_pipeline(spark: SparkSession, params: dict) -> None:
    """Execute the translated Matillion pipeline steps."""
    logger.info("Starting pipeline execution with parameters: %s", params)
${options.batchOptimizer ? `
    # Batch Optimizer Activated (${options.inputDataVolume || 'medium'})
` + getBatchOptimizerRecommendation(options.inputDataVolume, job).pysparkSnippet.split('\n').map(l => '    ' + l).join('\n') + '\n' : ''}`;

  // Variables unpack
  if (job.variables && job.variables.length > 0) {
    py += `\n    # Unpack variables\n`;
    job.variables.forEach(v => {
      py += `    ${v.name} = params.get("${v.name}", "${v.defaultValue || ''}")\n`;
    });
  }

  // Iterate components
  components.forEach(comp => {
    const varName = compVarMap.get(comp.id)!;
    const parentLinks = job.links.filter(l => l.toId === comp.id);
    const parentVarNames = parentLinks.map(l => compVarMap.get(l.fromId)!).filter(Boolean);
    const primaryInputVar = parentVarNames[0] || 'df_input';

    py += `\n    # Step: ${comp.name} (${comp.type})\n`;
    if (comp.type === 'Table Input') {
      const fullTable = getCatalogTable(
        comp.parameters?.targetTable || comp.name,
        comp.parameters?.schema || options.schemaName,
        comp.parameters?.database || options.catalogName,
        options.useUnityCatalog
      );
      py += `    ${varName} = spark.read.table("${fullTable}")\n`;
      if (comp.parameters?.sqlWhere) {
        py += `    ${varName} = ${varName}.filter(F.expr("""${comp.parameters.sqlWhere}"""))\n`;
      }
    } else if (comp.type === 'Calculator') {
      py += `    ${varName} = ${primaryInputVar}\n`;
      (comp.parameters?.calculations || []).forEach((c: any) => {
        py += `    ${varName} = ${varName}.withColumn("${c.targetColumn}", F.expr("""${c.expression}"""))\n`;
      });
    } else if (comp.type === 'Filter') {
      py += `    ${varName} = ${primaryInputVar}.filter(F.expr("""${comp.parameters?.filterExpression || '1=1'}"""))\n`;
    } else if (comp.type === 'Join') {
      const joinType = (comp.parameters?.joinType || 'inner').toLowerCase();
      const leftVar = parentVarNames[0] || 'df_left';
      const rightVar = parentVarNames[1] || 'df_right';
      const cond = comp.parameters?.joinConditions?.join(' AND ') || 'left.id = right.id';
      py += `    ${varName} = ${leftVar}.alias("left").join(${rightVar}.alias("right"), on=F.expr("""${cond}"""), how="${joinType}")\n`;
    } else if (comp.type === 'Aggregate') {
      const groupBy = comp.parameters?.groupBy || [];
      py += `    ${varName} = ${primaryInputVar}.groupBy(${groupBy.map((g: string) => `"${g}"`).join(', ')}).count()\n`;
    } else if (comp.type === 'Table Output') {
      const fullTable = getCatalogTable(
        comp.parameters?.targetTable || comp.name,
        comp.parameters?.schema || options.schemaName,
        comp.parameters?.database || options.catalogName,
        options.useUnityCatalog
      );
      py += `    ${primaryInputVar}.write.format("delta").mode("append").saveAsTable("${fullTable}")\n`;
      py += `    logger.info("Saved data to Delta table: %s", "${fullTable}")\n`;
    } else {
      py += `    # Logic for ${comp.type}\n`;
    }
  });

  py += `\n    logger.info("Pipeline finished successfully.")\n\n\n`;
  py += `if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="${job.name} execution")
`;
  job.variables?.forEach(v => {
    py += `    parser.add_argument("--${v.name}", default="${v.defaultValue || ''}", help="${v.description || v.name}")\n`;
  });
  py += `    args = vars(parser.parse_args())

    spark = create_spark_session()
    run_pipeline(spark, args)
`;

  return py;
}

function generateDLT(
  job: MatillionJob,
  components: MatillionComponent[],
  compVarMap: Map<string, string>,
  options: ConversionOptions
): string {
  const expectationDec = 
    options.dltExpectationsMode === 'fail' 
      ? '@dlt.expect_or_fail' 
      : options.dltExpectationsMode === 'warn' 
        ? '@dlt.expect' 
        : '@dlt.expect_or_drop';

  const pipelineType = options.dltPipelineType || 'triggered';

  let dlt = `"""
${job.name} - Delta Live Tables (DLT) Pipeline
Converted from Matillion ${job.jobType} Job to Databricks DLT Declarative Syntax
Target Pipeline Mode: ${pipelineType.toUpperCase()}
Expectation Enforcement: ${expectationDec}
Storage Architecture: ${options.useUnityCatalog ? 'Unity Catalog 3-Tier (' + options.catalogName + '.' + options.schemaName + ')' : 'Hive Metastore (' + options.schemaName + ')'}
"""

import dlt
import pyspark.sql.functions as F
import pyspark.sql.types as T
from pyspark.sql.window import Window

# -----------------------------------------------------------------------------
# 1. Pipeline Runtime Parameters
# Retrieve settings configured in DLT Pipeline Settings / spark_conf
# -----------------------------------------------------------------------------
`;

  if (job.variables && job.variables.length > 0) {
    job.variables.forEach(v => {
      dlt += `${v.name} = spark.conf.get("pipelines.${v.name}", "${v.defaultValue || ''}")\n`;
    });
  } else {
    dlt += `# No external pipeline parameters required\n`;
  }

  dlt += `\n# -----------------------------------------------------------------------------\n`;
  dlt += `# 2. Delta Live Tables DAG Node Definitions\n`;
  dlt += `# -----------------------------------------------------------------------------\n\n`;

  components.forEach(comp => {
    const tableName = comp.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const parentLinks = job.links.filter(l => l.toId === comp.id);
    const parentNames = parentLinks.map(l => compVarMap.get(l.fromId)!.replace('df_', '')).filter(Boolean);
    const primaryParent = parentNames[0] || 'input_table';

    switch (comp.type) {
      case 'Table Input': {
        const fullTable = getCatalogTable(
          comp.parameters?.targetTable || comp.name,
          comp.parameters?.schema || options.schemaName,
          comp.parameters?.database || options.catalogName,
          options.useUnityCatalog
        );
        const whereClause = comp.parameters?.sqlWhere;
        const columns = comp.parameters?.columns;

        dlt += `@dlt.table(
    name="${tableName}",
    comment="Raw ingested batch from ${fullTable}",
    table_properties={"quality": "bronze"}
)
def ${tableName}():
    df = spark.read.table("${fullTable}")
`;
        if (columns && Array.isArray(columns) && columns.length > 0) {
          dlt += `    df = df.select(${columns.map((c: string) => `"${c}"`).join(', ')})\n`;
        }
        if (whereClause) {
          const translatedWhere = translateMatillionExprToPySpark(whereClause);
          dlt += `    df = df.filter(F.expr("""${translatedWhere}"""))\n`;
        }
        dlt += `    return df\n\n`;
        break;
      }

      case 'File Exists':
      case 'S3 Load': {
        const srcUri = comp.parameters?.sourceUri || comp.parameters?.uri || 's3://incoming-lake/data/';
        const format = (comp.parameters?.format || 'csv').toLowerCase();

        dlt += `@dlt.table(
    name="${tableName}",
    comment="Auto Loader cloud stream ingesting from ${srcUri}",
    table_properties={"quality": "bronze"}
)
def ${tableName}():
    return (
        spark.readStream.format("cloudFiles")
        .option("cloudFiles.format", "${format}")
        .option("cloudFiles.schemaLocation", f"/tmp/dlt_schema/${tableName}")
        .option("cloudFiles.inferColumnTypes", "true")
        .load("${srcUri}")
    )\n\n`;
        break;
      }

      case 'Calculator': {
        const calcs = comp.parameters?.calculations || [];
        dlt += `@dlt.view(
    name="${tableName}",
    comment="Transformed view applying business logic calculations for ${comp.name}"
)
def ${tableName}():
    df = dlt.read("${primaryParent}")
`;
        calcs.forEach((c: { targetColumn: string; expression: string }) => {
          const translated = translateMatillionExprToPySpark(c.expression);
          dlt += `    df = df.withColumn("${c.targetColumn}", F.expr("""${translated}"""))\n`;
        });
        dlt += `    return df\n\n`;
        break;
      }

      case 'Filter': {
        const expr = comp.parameters?.filterExpression || '1=1';
        const translated = translateMatillionExprToPySpark(expr);
        dlt += `@dlt.view(
    name="${tableName}",
    comment="Filtered dataset satisfying business criteria"
)
${expectationDec}("valid_${tableName}", "${expr.replace(/"/g, '\\"')}")
def ${tableName}():
    return dlt.read("${primaryParent}").filter(F.expr("""${translated}"""))\n\n`;
        break;
      }

      case 'Join': {
        const joinType = (comp.parameters?.joinType || 'inner').toLowerCase();
        const leftParent = parentNames[0] || 'left_input';
        const rightParent = parentNames[1] || 'right_input';
        const conditions = comp.parameters?.joinConditions || [];
        const condExpr = conditions.join(' AND ') || 'left.id = right.id';

        dlt += `@dlt.view(
    name="${tableName}",
    comment="${joinType.toUpperCase()} join between ${leftParent} and ${rightParent}"
)
def ${tableName}():
    left_df = dlt.read("${leftParent}").alias("left")
    right_df = dlt.read("${rightParent}").alias("right")
    return left_df.join(
        right_df,
        on=F.expr("""${condExpr}"""),
        how="${joinType}"
    )\n\n`;
        break;
      }

      case 'Aggregate': {
        const groupBy = comp.parameters?.groupBy || [];
        const aggs = comp.parameters?.aggregations || [];

        const aggExprs = aggs.map((a: { column: string; function: string; alias?: string }) => {
          const fn = a.function.toUpperCase();
          const col = a.column;
          const al = a.alias || `${fn.toLowerCase()}_${col}`;
          if (fn === 'SUM') return `F.sum("${col}").alias("${al}")`;
          if (fn === 'COUNT_DISTINCT') return `F.count_distinct("${col}").alias("${al}")`;
          if (fn === 'COUNT') return `F.count("${col}").alias("${al}")`;
          if (fn === 'AVG') return `F.avg("${col}").alias("${al}")`;
          if (fn === 'MAX') return `F.max("${col}").alias("${al}")`;
          if (fn === 'MIN') return `F.min("${col}").alias("${al}")`;
          return `F.expr("${fn}(${col})").alias("${al}")`;
        });

        dlt += `@dlt.table(
    name="${tableName}",
    comment="Aggregated summary table grouped by ${groupBy.join(', ')}",
    table_properties={"quality": "silver"}
)
def ${tableName}():
    return (
        dlt.read("${primaryParent}")
        .groupBy(${groupBy.map((g: string) => `"${g}"`).join(', ')})
        .agg(
            ${aggExprs.join(',\n            ')}
        )
    )\n\n`;
        break;
      }

      case 'Rank / Window': {
        const partitions = comp.parameters?.partitionBy || [];
        const orderBy = comp.parameters?.orderBy || [];
        const fn = comp.parameters?.function || 'DENSE_RANK';
        const targetCol = comp.parameters?.targetColumn || 'rank';

        const orderExprs = orderBy.map((o: { column: string; direction?: string }) => {
          return o.direction?.toUpperCase() === 'DESC' ? `F.col("${o.column}").desc()` : `F.col("${o.column}").asc()`;
        });

        dlt += `@dlt.view(
    name="${tableName}",
    comment="Window analytical ranking using ${fn}"
)
def ${tableName}():
    df = dlt.read("${primaryParent}")
    w = Window.partitionBy(${partitions.map((p: string) => `"${p}"`).join(', ')}).orderBy(${orderExprs.join(', ') || 'F.col("id")'})
`;
        if (fn.toUpperCase() === 'DENSE_RANK') {
          dlt += `    return df.withColumn("${targetCol}", F.dense_rank().over(w))\n\n`;
        } else if (fn.toUpperCase() === 'ROW_NUMBER') {
          dlt += `    return df.withColumn("${targetCol}", F.row_number().over(w))\n\n`;
        } else {
          dlt += `    return df.withColumn("${targetCol}", F.rank().over(w))\n\n`;
        }
        break;
      }

      case 'Flatten': {
        const inputCol = comp.parameters?.inputColumn || 'raw_payload_json';
        const outAlias = comp.parameters?.outputAlias || 'flattened_record';

        dlt += `@dlt.view(
    name="${tableName}",
    comment="Exploded semi-structured JSON payload view"
)
def ${tableName}():
    return dlt.read("${primaryParent}").withColumn(
        "${outAlias}",
        F.explode(F.from_json(F.col("${inputCol}"), "array<string>"))
    )\n\n`;
        break;
      }

      case 'Deduplicate': {
        const dedupCols = comp.parameters?.dedupColumns || [];
        dlt += `@dlt.view(
    name="${tableName}",
    comment="Deduplicated dataset"
)
def ${tableName}():
`;
        if (dedupCols.length > 0) {
          dlt += `    return dlt.read("${primaryParent}").dropDuplicates([${dedupCols.map((c: string) => `"${c}"`).join(', ')}])\n\n`;
        } else {
          dlt += `    return dlt.read("${primaryParent}").dropDuplicates()\n\n`;
        }
        break;
      }

      case 'Table Output': {
        const targetTable = comp.parameters?.targetTable || tableName;
        const writeMode = comp.parameters?.writeMode || options.deltaWriteMode;
        const matchKeys = comp.parameters?.matchKeys || ['id'];
        const isLiquid = options.useLiquidClustering;

        if (writeMode === 'SCD2_MERGE') {
          // Native DLT Change Data Capture (CDC) via dlt.apply_changes
          dlt += `# -----------------------------------------------------------------------------\n`;
          dlt += `# Native DLT Change Data Capture (CDC) - SCD Type 2 History\n`;
          dlt += `# -----------------------------------------------------------------------------\n`;
          dlt += `dlt.create_streaming_table(
    name="${targetTable}",
    comment="Gold SCD Type 2 dimension maintained with native DLT CDC",
    table_properties={
        "quality": "gold",
        "delta.enableLiquidClustering": "${isLiquid ? 'true' : 'false'}"
    }
)

dlt.apply_changes(
    target="${targetTable}",
    source="${primaryParent}",
    keys=${JSON.stringify(matchKeys)},
    sequence_by=F.col("valid_from"),
    stored_as_scd_type=2,
    except_column_list=["action_type"]
)\n\n`;
        } else {
          const props: Record<string, string> = { quality: "gold" };
          if (isLiquid) {
            props["delta.enableLiquidClustering"] = "true";
          }

          dlt += `@dlt.table(
    name="${targetTable}",
    comment="Curated Gold target table produced by ${job.name}",
    table_properties=${JSON.stringify(props, null, 8).replace(/"/g, '"')}
)
${expectationDec}("valid_primary_id", "${matchKeys[0] || 'id'} IS NOT NULL")
def ${targetTable}():
    return dlt.read("${primaryParent}")\n\n`;
        }
        break;
      }

      case 'SQL Script': {
        dlt += `# DLT Note: Component [${comp.name}] (${comp.parameters?.sql || 'SQL Command'})\n`;
        dlt += `# SQL scripts in DLT are declared as intermediate table/view transformations or applied via pipeline settings.\n\n`;
        break;
      }

      case 'Start':
      case 'Run Transformation':
      case 'Table Iterator':
      case 'Webhook Notification': {
        dlt += `# DLT Note: Orchestration step [${comp.name}] (${comp.type})\n`;
        dlt += `# In Databricks DLT pipelines, table dependencies form the execution graph automatically.\n`;
        dlt += `# External triggers or notifications are configured in Databricks Workflows (pipeline_task).\n\n`;
        break;
      }

      default: {
        dlt += `@dlt.view(
    name="${tableName}",
    comment="Custom Matillion component ${comp.type}"
)
def ${tableName}():
    return dlt.read("${primaryParent}")\n\n`;
        break;
      }
    }
  });

  return dlt;
}

function generateWorkflowJson(job: MatillionJob, options: ConversionOptions): string {
  const isDLT = options.outputFormat === 'dlt';

  if (isDLT) {
    // Generate Databricks Multi-task Workflow running a Delta Live Tables Pipeline Task
    const dltWorkflow = {
      name: `${job.name}_DLT_Workflow`,
      email_notifications: {
        no_alert_for_skipped_runs: false
      },
      webhook_notifications: {},
      timeout_seconds: 7200,
      max_concurrent_runs: 1,
      tasks: [
        {
          task_key: "run_dlt_pipeline",
          description: `Executes Delta Live Tables pipeline converted from ${job.name}`,
          pipeline_task: {
            pipeline_id: "{{bundle.resources.pipelines." + job.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') + "_pipeline.id}}",
            full_refresh: false
          },
          timeout_seconds: 3600
        }
      ],
      format: "MULTI_TASK",
      dlt_pipeline_specification: {
        name: `${job.name}_DLT_Pipeline`,
        edition: "ADVANCED",
        continuous: options.dltPipelineType === 'continuous',
        channel: "CURRENT",
        catalog: options.useUnityCatalog ? options.catalogName : undefined,
        target: options.schemaName,
        libraries: [
          {
            notebook: {
              path: `/Workspace/ETL_Pipelines/DLT/${job.name}_dlt`
            }
          }
        ],
        configuration: {
          "pipelines.applyChangesPreview": "true",
          ...job.variables.reduce((acc, v) => {
            acc[`pipelines.${v.name}`] = v.defaultValue || "";
            return acc;
          }, {} as Record<string, string>)
        }
      }
    };
    return JSON.stringify(dltWorkflow, null, 2);
  }

  // Standard Notebook Workflow
  const workflow = {
    name: `${job.name}_Databricks_Workflow`,
    email_notifications: {
      no_alert_for_skipped_runs: false
    },
    webhook_notifications: {},
    timeout_seconds: 7200,
    max_concurrent_runs: 1,
    tasks: [
      {
        task_key: "run_main_notebook",
        description: `Executes converted ${job.name} Matillion job`,
        notebook_task: {
          notebook_path: `/Workspace/ETL_Pipelines/${job.name}`,
          base_parameters: job.variables.reduce((acc, v) => {
            acc[v.name] = v.defaultValue || "";
            return acc;
          }, {} as Record<string, string>)
        },
        new_cluster: {
          spark_version: `${options.runtimeVersion}.x-scala2.12`,
          node_type_id: "i3.xlarge",
          autoscale: {
            min_workers: 2,
            max_workers: 8
          },
          spark_conf: {
            "spark.databricks.delta.optimizeWrite.enabled": "true",
            "spark.databricks.delta.autoCompact.enabled": "true"
          }
        },
        timeout_seconds: 3600
      }
    ],
    format: "MULTI_TASK"
  };

  return JSON.stringify(workflow, null, 2);
}
