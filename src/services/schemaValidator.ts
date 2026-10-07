import { MatillionComponent, MatillionJob, SchemaColumnPreview, SchemaValidationResult } from '../types/matillion';

export interface BatchOptimizerSettings {
  volume: 'small' | 'medium' | 'large' | 'massive';
  label: string;
  sizeRange: string;
  targetFileSizeMB: number;
  targetFileSizeBytes: number;
  recommendedPartitionCols: string[];
  partitionStrategy: string;
  autoCompact: boolean;
  optimizeWrite: boolean;
  aqeCoalesce: boolean;
  liquidClustering: boolean;
  skewJoinMitigation: boolean;
  sparkConfigs: Record<string, string>;
  pysparkSnippet: string;
}

export function getBatchOptimizerRecommendation(
  volume: 'small' | 'medium' | 'large' | 'massive' = 'medium',
  job?: MatillionJob
): BatchOptimizerSettings {
  // Infer partition columns from job components if available
  const detectedCols: string[] = [];
  if (job) {
    job.components.forEach(c => {
      if (c.parameters?.partitionKeys && Array.isArray(c.parameters.partitionKeys)) {
        c.parameters.partitionKeys.forEach((k: string) => {
          if (!detectedCols.includes(k)) detectedCols.push(k);
        });
      }
    });
  }
  if (detectedCols.length === 0) {
    detectedCols.push('event_date', 'country_code');
  }

  switch (volume) {
    case 'small':
      return {
        volume: 'small',
        label: 'Small (< 10 GB)',
        sizeRange: '< 10 GB input per batch',
        targetFileSizeMB: 64,
        targetFileSizeBytes: 67108864,
        recommendedPartitionCols: [],
        partitionStrategy: 'Unpartitioned Delta Table (prevent small-file problem)',
        autoCompact: true,
        optimizeWrite: true,
        aqeCoalesce: true,
        liquidClustering: false,
        skewJoinMitigation: false,
        sparkConfigs: {
          'spark.databricks.delta.targetFileSize': '67108864',
          'spark.databricks.delta.autoCompact.enabled': 'true',
          'spark.databricks.delta.optimizeWrite.enabled': 'true',
          'spark.sql.adaptive.coalescePartitions.enabled': 'true'
        },
        pysparkSnippet: `# Small batch optimization: unpartitioned table with 64MB target file size
spark.conf.set("spark.databricks.delta.targetFileSize", "67108864")
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")`
      };

    case 'medium':
      return {
        volume: 'medium',
        label: 'Medium (10 GB - 250 GB)',
        sizeRange: '10 GB - 250 GB input per batch',
        targetFileSizeMB: 128,
        targetFileSizeBytes: 134217728,
        recommendedPartitionCols: detectedCols.slice(0, 1),
        partitionStrategy: `Partition by ${detectedCols[0] || 'date'} or single-column Liquid Clustering`,
        autoCompact: true,
        optimizeWrite: true,
        aqeCoalesce: true,
        liquidClustering: true,
        skewJoinMitigation: true,
        sparkConfigs: {
          'spark.databricks.delta.targetFileSize': '134217728',
          'spark.databricks.delta.autoCompact.enabled': 'true',
          'spark.databricks.delta.optimizeWrite.enabled': 'true',
          'spark.sql.adaptive.coalescePartitions.enabled': 'true',
          'spark.sql.adaptive.skewJoin.enabled': 'true'
        },
        pysparkSnippet: `# Medium batch optimization: 128MB target file size with adaptive coalesce
spark.conf.set("spark.databricks.delta.targetFileSize", "134217728")
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")`
      };

    case 'large':
      return {
        volume: 'large',
        label: 'Large (250 GB - 2 TB)',
        sizeRange: '250 GB - 2 TB input per batch',
        targetFileSizeMB: 256,
        targetFileSizeBytes: 268435456,
        recommendedPartitionCols: detectedCols.slice(0, 2),
        partitionStrategy: `Databricks Liquid Clustering CLUSTER BY (${detectedCols.slice(0, 2).join(', ')})`,
        autoCompact: true,
        optimizeWrite: true,
        aqeCoalesce: true,
        liquidClustering: true,
        skewJoinMitigation: true,
        sparkConfigs: {
          'spark.databricks.delta.targetFileSize': '268435456',
          'spark.databricks.delta.autoCompact.enabled': 'true',
          'spark.databricks.delta.optimizeWrite.enabled': 'true',
          'spark.sql.adaptive.coalescePartitions.enabled': 'true',
          'spark.sql.adaptive.skewJoin.enabled': 'true',
          'spark.sql.files.maxPartitionBytes': '268435456'
        },
        pysparkSnippet: `# Large batch optimization: 256MB target file size & Liquid Clustering
spark.conf.set("spark.databricks.delta.targetFileSize", "268435456")
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.files.maxPartitionBytes", "268435456")`
      };

    case 'massive':
      return {
        volume: 'massive',
        label: 'Massive Enterprise (> 2 TB)',
        sizeRange: '> 2 TB input per batch',
        targetFileSizeMB: 512,
        targetFileSizeBytes: 536870912,
        recommendedPartitionCols: detectedCols.slice(0, 3),
        partitionStrategy: `Multi-dimensional Liquid Clustering with Bloom Filters on ID keys`,
        autoCompact: true,
        optimizeWrite: true,
        aqeCoalesce: true,
        liquidClustering: true,
        skewJoinMitigation: true,
        sparkConfigs: {
          'spark.databricks.delta.targetFileSize': '536870912',
          'spark.databricks.delta.autoCompact.enabled': 'true',
          'spark.databricks.delta.optimizeWrite.enabled': 'true',
          'spark.sql.adaptive.coalescePartitions.enabled': 'true',
          'spark.sql.adaptive.skewJoin.enabled': 'true',
          'spark.sql.adaptive.skewJoin.skewedPartitionFactor': '3',
          'spark.sql.shuffle.partitions': 'auto'
        },
        pysparkSnippet: `# Massive enterprise batch: 512MB target file size & aggressive skew mitigation
spark.conf.set("spark.databricks.delta.targetFileSize", "536870912")
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "3")`
      };
  }
}

/**
 * Validates schema for a given component and returns expected source vs target types
 * and flags potential type-mismatch risks before conversion.
 */
export function validateComponentSchema(
  component: MatillionComponent,
  job?: MatillionJob
): SchemaValidationResult {
  const columns: SchemaColumnPreview[] = [];
  const recommendations: string[] = [];

  const platform = job?.targetPlatform || 'Snowflake';

  // 1. Determine columns from parameters or synthesize typical schema
  const paramCols = component.parameters?.columns || [];
  const calculations = component.parameters?.calculations || [];
  const aggCols = component.parameters?.aggregations || component.parameters?.aggregateColumns || [];

  if (Array.isArray(paramCols) && paramCols.length > 0) {
    paramCols.forEach((col: any) => {
      const colName = typeof col === 'string' ? col : col.name || col.column || 'col';
      columns.push(inferColumnMapping(colName, platform));
    });
  }

  // Add calculation columns
  if (Array.isArray(calculations)) {
    calculations.forEach((calc: any) => {
      const colName = calc.targetColumn || 'calculated_col';
      const expr = (calc.expression || '').toLowerCase();
      if (expr.includes('case when') || expr.includes('if')) {
        columns.push({
          columnName: colName,
          sourceType: 'NUMBER / VARCHAR',
          targetSparkType: 'T.StringType() | T.IntegerType()',
          targetSqlType: 'STRING / INT',
          nullable: true,
          riskLevel: 'low',
          riskReason: 'Conditional CASE branches must evaluate to the same uniform type in PySpark.',
          recommendedMitigation: 'Ensure all THEN / ELSE clauses in CASE statements cast to identical data types.'
        });
      } else if (expr.includes('sum') || expr.includes('avg') || expr.includes('*') || expr.includes('/')) {
        columns.push({
          columnName: colName,
          sourceType: 'NUMBER(38, 4)',
          targetSparkType: 'T.DecimalType(38, 4)',
          targetSqlType: 'DECIMAL(38, 4)',
          nullable: true,
          riskLevel: 'safe',
          riskReason: 'Math operations preserve precision in DecimalType.',
          recommendedMitigation: 'Use explicit .cast(T.DecimalType(38,4)) to prevent floating-point inaccuracy.'
        });
      } else {
        columns.push(inferColumnMapping(colName, platform));
      }
    });
  }

  // Add aggregation columns
  if (Array.isArray(aggCols)) {
    aggCols.forEach((agg: any) => {
      const colName = agg.targetColumn || `${agg.function || 'agg'}_${agg.sourceColumn || 'metric'}`;
      columns.push({
        columnName: colName,
        sourceType: 'NUMBER(38, 2)',
        targetSparkType: 'T.DecimalType(38, 2)',
        targetSqlType: 'DECIMAL(38, 2)',
        nullable: true,
        riskLevel: 'safe',
        riskReason: 'Aggregate metrics mapped to high precision Delta Lake DecimalType.',
        recommendedMitigation: 'None required.'
      });
    });
  }

  // If no columns could be parsed, provide realistic columns based on component type
  if (columns.length === 0) {
    columns.push(
      inferColumnMapping('id', platform),
      inferColumnMapping('name', platform),
      inferColumnMapping('created_at', platform),
      inferColumnMapping('amount', platform),
      inferColumnMapping('status', platform),
      inferColumnMapping('raw_payload', platform)
    );
  }

  // Count risks
  const riskCounts = {
    safe: 0,
    low: 0,
    warning: 0,
    high: 0
  };

  columns.forEach(col => {
    riskCounts[col.riskLevel]++;
  });

  if (riskCounts.high > 0) {
    recommendations.push(
      'Semi-structured or spatial types detected. Use PySpark `F.from_json()` with an explicit `StructType` schema instead of dynamic string evaluation.'
    );
  }
  if (riskCounts.warning > 0) {
    recommendations.push(
      'Snowflake TIMESTAMP_NTZ and high-precision NUMBER(38,0) detected. Ensure Databricks Runtime 13.3+ TimestampNTZType is enabled, or standardize timezone conversion using `to_utc_timestamp()`.'
    );
  }
  if (riskCounts.low > 0) {
    recommendations.push(
      'Double precision floating point columns should be verified for rounding discrepancies between query engines.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('All source column data types map 100% cleanly to native PySpark and Delta Lake primitives without risk of precision loss.');
  }

  const overallStatus: 'safe' | 'warning' | 'critical' = 
    riskCounts.high > 0 ? 'critical' : riskCounts.warning > 0 ? 'warning' : 'safe';

  return {
    componentId: component.id,
    componentName: component.name,
    componentType: component.type,
    columns,
    totalColumns: columns.length,
    riskCounts,
    overallStatus,
    recommendations
  };
}

/**
 * Infers source datatype, Spark datatype, Delta SQL type, and potential risk
 * based on column name conventions and cloud data warehouse standards.
 */
function inferColumnMapping(colName: string, platform: string): SchemaColumnPreview {
  const name = colName.toLowerCase();

  if (name.includes('json') || name.includes('payload') || name.includes('variant') || name.includes('raw_data') || name.includes('metadata')) {
    return {
      columnName: colName,
      sourceType: platform === 'Snowflake' ? 'VARIANT' : platform === 'Redshift' ? 'SUPER' : 'NVARCHAR(MAX)',
      targetSparkType: 'T.StringType() / T.StructType',
      targetSqlType: 'STRING / STRUCT',
      nullable: true,
      riskLevel: 'high',
      riskReason: `Semi-structured ${platform === 'Snowflake' ? 'VARIANT' : 'JSON'} type requires schema definition in PySpark. Implicit casting can cause schema evolution lag.`,
      recommendedMitigation: 'Use `F.from_json(col, schema)` with an explicit StructType schema or Databricks Variant Data Type (DBR 15.3+).'
    };
  }

  if (name.endsWith('_ntz') || name.includes('created_at') || name.includes('timestamp') || name.includes('updated_at')) {
    return {
      columnName: colName,
      sourceType: 'TIMESTAMP_NTZ',
      targetSparkType: 'T.TimestampNTZType()',
      targetSqlType: 'TIMESTAMP_NTZ',
      nullable: true,
      riskLevel: 'warning',
      riskReason: 'Snowflake TIMESTAMP_NTZ has no session timezone offset. PySpark TimestampType will implicitly adjust by session timezone unless TimestampNTZType (DBR 13.3+) is used.',
      recommendedMitigation: 'Ensure `spark.sql.timestampType = TIMESTAMP_NTZ` or convert explicitly using `F.to_utc_timestamp()`.'
    };
  }

  if (name.includes('order_date') || name.includes('birth_date') || name.includes('signup_date') || name.endsWith('_date')) {
    return {
      columnName: colName,
      sourceType: 'DATE',
      targetSparkType: 'T.DateType()',
      targetSqlType: 'DATE',
      nullable: true,
      riskLevel: 'safe',
      riskReason: 'Direct 1-to-1 conversion between Snowflake DATE and Delta Lake DateType.',
      recommendedMitigation: 'None required. Native date partition support.'
    };
  }

  if (name.endsWith('_id') || name === 'id' || name.includes('customer_id') || name.includes('order_id')) {
    return {
      columnName: colName,
      sourceType: 'NUMBER(38, 0)',
      targetSparkType: 'T.LongType() / T.DecimalType(38,0)',
      targetSqlType: 'BIGINT / DECIMAL(38,0)',
      nullable: false,
      riskLevel: 'warning',
      riskReason: 'Snowflake NUMBER(38,0) will silently overflow 64-bit BigInt/LongType if values exceed 9,223,372,036,854,775,807.',
      recommendedMitigation: 'Cast to `T.LongType()` if within 64-bit integer limits, or retain `T.DecimalType(38, 0)` for strict overflow safety.'
    };
  }

  if (name.includes('amount') || name.includes('price') || name.includes('total') || name.includes('tax') || name.includes('subtotal') || name.includes('revenue')) {
    return {
      columnName: colName,
      sourceType: 'NUMBER(18, 2)',
      targetSparkType: 'T.DecimalType(18, 2)',
      targetSqlType: 'DECIMAL(18, 2)',
      nullable: true,
      riskLevel: 'safe',
      riskReason: 'Exact decimal arithmetic guaranteed without binary floating-point drift.',
      recommendedMitigation: 'Direct 1-to-1 mapping into Delta Lake DecimalType(18,2).'
    };
  }

  if (name.includes('quantity') || name.includes('count') || name.includes('item_count') || name.includes('tier') || name.includes('rank')) {
    return {
      columnName: colName,
      sourceType: 'INTEGER',
      targetSparkType: 'T.IntegerType()',
      targetSqlType: 'INT',
      nullable: true,
      riskLevel: 'safe',
      riskReason: 'Standard 32-bit signed integer.',
      recommendedMitigation: 'Direct 1-to-1 mapping.'
    };
  }

  if (name.includes('discount') || name.includes('ratio') || name.includes('pct') || name.includes('rate') || name.includes('score')) {
    return {
      columnName: colName,
      sourceType: 'FLOAT',
      targetSparkType: 'T.DoubleType()',
      targetSqlType: 'DOUBLE',
      nullable: true,
      riskLevel: 'low',
      riskReason: 'Minor IEEE 754 precision representation variations between Snowflake and Spark Tungsten execution engine.',
      recommendedMitigation: 'Use `F.round(col, 4)` or DecimalType(10,4) for financial calculations.'
    };
  }

  if (name.startsWith('is_') || name.startsWith('has_') || name.endsWith('_flag') || name === 'active' || name === 'status_flag') {
    return {
      columnName: colName,
      sourceType: 'BOOLEAN',
      targetSparkType: 'T.BooleanType()',
      targetSqlType: 'BOOLEAN',
      nullable: false,
      riskLevel: 'safe',
      riskReason: 'Direct boolean mapping.',
      recommendedMitigation: 'None required.'
    };
  }

  // Default string column
  return {
    columnName: colName,
    sourceType: 'VARCHAR(255)',
    targetSparkType: 'T.StringType()',
    targetSqlType: 'STRING',
    nullable: true,
    riskLevel: 'safe',
    riskReason: 'Spark StringType dynamically handles arbitrary-length strings up to 2GB per cell.',
    recommendedMitigation: 'None required.'
  };
}
