import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Code2, 
  Layers, 
  Database, 
  Sparkles, 
  Terminal, 
  Workflow, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  FileCode, 
  Zap, 
  HelpCircle, 
  Cpu, 
  Mail, 
  Globe, 
  User,
  Sliders,
  AlertTriangle,
  Scale,
  FolderOpen,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { FUNCTION_MAPPINGS } from '../services/functionMapper';

export const DocumentationPage: React.FC<{ onNavigateToStudio: () => void }> = ({ onNavigateToStudio }) => {
  const [activeSection, setActiveSection] = useState('intro-matillion');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState('');

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Sub-headings clickable from the right side (similar to GCP Console and cloud documentation)
  const subHeadings = [
    { id: 'intro-matillion', title: 'What is Matillion ETL?', category: 'Introduction', icon: Workflow },
    { id: 'intro-dbx', title: 'What is Databricks (DBX)?', category: 'Introduction', icon: Zap },
    { id: 'comparison', title: 'Architectural Comparison & ROI', category: 'Architecture', icon: Scale },
    { id: 'components-all', title: 'All Mentioned Components & Translators', category: 'Components', icon: Database },
    { id: 'batch-optimizer', title: 'Batch Optimizer & File Sizing', category: 'Optimization', icon: Cpu },
    { id: 'schema-validation', title: 'Schema Validation & Type Safety', category: 'Governance', icon: ShieldCheck },
    { id: 'complexity-score', title: 'Complexity Scoring Methodology', category: 'Metrics', icon: Sliders },
    { id: 'dlt', title: 'Delta Live Tables (DLT) & Streaming', category: 'Pipelines', icon: Layers },
    { id: 'unity-catalog', title: 'Unity Catalog Governance (3-Level)', category: 'Governance', icon: ShieldCheck },
    { id: 'dab', title: 'Databricks Asset Bundles (DABs)', category: 'DevOps', icon: Terminal },
    { id: 'functions', title: 'Function Translation Matrix', category: 'Functions', icon: Code2 },
    { id: 'faq', title: 'Migration FAQ & Best Practices', category: 'Guides', icon: HelpCircle },
    { id: 'contacts-info', title: 'Contacts & General Info', category: 'Support', icon: Globe }
  ];

  const filteredSubHeadings = subHeadings.filter(s => 
    s.title.toLowerCase().includes(docSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(docSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Center Main Documentation Article */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 max-w-4xl mx-auto">
        
        {/* SUB-MENU 1: WHAT IS MATILLION? */}
        {activeSection === 'intro-matillion' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
                <span>INTRODUCTION &amp; OVERVIEW</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                What is Matillion ETL?
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                A comprehensive guide to Matillion ETL architecture, job typologies, component execution model, and enterprise design patterns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                  <Workflow className="w-4 h-4" />
                  <span>Pushdown ELT Architecture</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unlike traditional ETL engines (like Informatica or Talend) that perform transformations on dedicated server compute, Matillion operates on an <strong>ELT (Extract, Load, Transform) pushdown model</strong>. It generates dialect-specific SQL (e.g. Snowflake SQL, Amazon Redshift SQL, Synapse T-SQL) and pushes execution into the underlying data warehouse.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Layers className="w-4 h-4" />
                  <span>Dual Job Typology</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Matillion separates jobs into two core models:
                  <br />• <strong>Transformation Jobs:</strong> Directed acyclic graphs (DAGs) representing data pipelines with components like Table Input, Calculator, Join, Filter, Aggregate, and Table Output.
                  <br />• <strong>Orchestration Jobs:</strong> Control-flow pipelines managing table creation, data loading, iterations, scripts, and conditional branching.
                </p>
              </div>
            </div>

            {/* Core Architectural Components */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-400" />
                <span>Matillion Component Ecosystem</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-semibold text-orange-300 block mb-1">Data Ingestion Components</span>
                  <p className="text-slate-400 text-[11px]">
                    Table Input, S3 Load, Azure Blob Load, Google Cloud Storage Load, and Salesforce/API Query connectors.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-semibold text-cyan-300 block mb-1">Data Manipulation Components</span>
                  <p className="text-slate-400 text-[11px]">
                    Calculator, Filter, Join (Inner, Left, Full, Cross), Aggregate, Window/Rank, and Flatten Variant JSON parser.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-semibold text-emerald-300 block mb-1">Target Loading &amp; Output</span>
                  <p className="text-slate-400 text-[11px]">
                    Table Output, Rewrite Table, and SCD Type 2 Component (merging slowly changing dimensions).
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-semibold text-purple-300 block mb-1">Parameters &amp; Control Flow</span>
                  <p className="text-slate-400 text-[11px]">
                    Environment Variables, Grid Variables, Python / Bash Scripts, and Run Orchestration triggers.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Convert from Matillion to Databricks */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-950/20 to-amber-950/10 border border-orange-500/20 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>The Challenge: Warehouse Vendor Lock-In &amp; Scalability Bottlenecks</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Because Matillion transforms data by compiling graphical blocks into bulky warehouse SQL statements, complex transformations can cause massive Snowflake credit consumption, concurrency queueing, and difficulty scaling to streaming / AI workloads. Migrating to Databricks PySpark and Delta Lake unlocks unified streaming/batch processing, ACID transactions, Unity Catalog governance, and lower infrastructure costs.
              </p>
            </div>
          </div>
        )}

        {/* SUB-MENU 2: WHAT IS DATABRICKS? */}
        {activeSection === 'intro-dbx' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                <span>TARGET LAKEHOUSE PLATFORM</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                What is Databricks (DBX) &amp; PySpark?
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                An introduction to the Databricks Lakehouse architecture, PySpark DataFrames, Delta Lake ACID storage, and Unity Catalog.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Databricks Lakehouse Platform</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Databricks unifies data engineering, streaming, data warehousing, and machine learning on a single open Lakehouse foundation. Instead of maintaining proprietary silos, all data is stored in open Delta Lake tables on object storage (AWS S3, Azure ADLS Gen2, Google Cloud Storage).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Delta Lake ACID Storage</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Delta Lake is the open storage layer that brings ACID transactions, schema enforcement, zero-copy time travel, and lightning-fast parquet caching to data lakes. It eliminates corruption during concurrent pipeline runs.
                </p>
              </div>
            </div>

            {/* Core Databricks Architectural Pillars */}
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm">Core Pillars of the Databricks Target Architecture</h3>
              
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <span className="font-bold text-white block">PySpark DataFrame API</span>
                    <span className="text-slate-400">
                      Distributed memory execution engine with Catalyst optimizer and Tungsten bytecode generation, outperforming legacy single-node SQL compilers.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <span className="font-bold text-white block">Unity Catalog Governance</span>
                    <span className="text-slate-400">
                      Industry standard 3-level namespace (<code className="text-cyan-300">catalog.schema.table</code>) with centralized data lineage, fine-grained access control, and auditing across all workspaces.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <span className="font-bold text-white block">Delta Live Tables (DLT)</span>
                    <span className="text-slate-400">
                      Declarative framework for building reliable data pipelines with automatic graph dependencies, streaming ingestion, and built-in data quality expectations (<code className="text-amber-300">@dlt.expect_or_drop</code>).
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">4</span>
                  <div>
                    <span className="font-bold text-white block">Databricks Liquid Clustering</span>
                    <span className="text-slate-400">
                      Next-generation flexible data layout (<code className="text-cyan-300">CLUSTER BY</code>) replacing rigid partition columns and manual Z-ORDER indexing without data skew penalties.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MENU 3: ARCHITECTURAL COMPARISON & ROI */}
        {activeSection === 'comparison' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                <span>SIDE-BY-SIDE BENCHMARK</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Architectural Comparison: Matillion vs. Databricks
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Key technical differences between warehouse pushdown ELT and the modern Databricks Lakehouse.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Architectural Dimension</th>
                    <th className="p-3 text-orange-400">Matillion ETL</th>
                    <th className="p-3 text-cyan-400">Databricks PySpark &amp; DLT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950 font-sans">
                  <tr>
                    <td className="p-3 font-semibold text-white">Execution Model</td>
                    <td className="p-3 text-slate-400">Pushdown SQL generated to target warehouse</td>
                    <td className="p-3 text-cyan-300 font-semibold">Native distributed Spark engine (memory + disk)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Storage Format</td>
                    <td className="p-3 text-slate-400">Proprietary warehouse micro-partitions</td>
                    <td className="p-3 text-emerald-300 font-semibold">Open Delta Lake (Apache Parquet + ACID log)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Governance &amp; Catalog</td>
                    <td className="p-3 text-slate-400">Vendor-specific schemas (2-level DB.Schema)</td>
                    <td className="p-3 text-white">Unity Catalog 3-level (<code className="text-cyan-300">catalog.schema.table</code>)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Streaming Capabilities</td>
                    <td className="p-3 text-rose-400">Batch-only (scheduled polling)</td>
                    <td className="p-3 text-emerald-400 font-semibold">Native Structured Streaming &amp; DLT</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Slowly Changing Dims (SCD2)</td>
                    <td className="p-3 text-slate-400">Heavy multi-step SQL queries &amp; temp tables</td>
                    <td className="p-3 text-cyan-300">Native <code className="text-amber-300">dlt.apply_changes(stored_as_scd_type=2)</code></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">CI/CD &amp; Version Control</td>
                    <td className="p-3 text-slate-400">Binary project exports or proprietary Git sync</td>
                    <td className="p-3 text-emerald-300">Native Git Folders, Databricks Asset Bundles (DABs)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Cost &amp; Licensing</td>
                    <td className="p-3 text-slate-400">High dual-cost: Matillion credit + Warehouse compute</td>
                    <td className="p-3 text-cyan-300">Single compute plane with Serverless &amp; Auto-scaling</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-MENU 4: ALL MENTIONED COMPONENTS */}
        {activeSection === 'components-all' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                <span>TRANSPILATION DIRECTORY</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                All Mentioned Components &amp; PySpark Translators
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Detailed translation pattern and generated PySpark equivalent for every Matillion component supported by MatConvDBX.ai.studio.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* 1. Table Input */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-400" />
                    Table Input (Read Component)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Source: Warehouse</span>
                </div>
                <p className="text-xs text-slate-300">
                  Reads from an enterprise source table or view with column selection and SQL WHERE predicates.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Transpiled PySpark equivalent
df_stg_customers = spark.read.table("gold_analytics.crm.customers") \\
    .select("customer_id", "email", "signup_date", "country") \\
    .filter(F.expr("status = 'ACTIVE'"))`}
                </pre>
              </div>

              {/* 2. Calculator */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Calculator (Transform Component)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Calculated Columns</span>
                </div>
                <p className="text-xs text-slate-300">
                  Evaluates mathematical expressions, string manipulations, and conditional CASE WHEN logic.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Transpiled PySpark equivalent with withColumns() batching
df_calc = df_input.withColumns({
    "net_price": F.expr("quantity * unit_price * (1 - COALESCE(discount_pct, 0) / 100.0)"),
    "is_discounted": F.expr("CASE WHEN discount_pct > 0 THEN 1 ELSE 0 END")
})`}
                </pre>
              </div>

              {/* 3. Join */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-purple-400" />
                    Join (Multi-Input Combine)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Inner / Left / Full</span>
                </div>
                <p className="text-xs text-slate-300">
                  Joins two or more upstream DataFrames with aliasing to prevent column collision and ambiguous references.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Transpiled PySpark equivalent
df_joined = df_orders.alias("o").join(
    df_items.alias("i"),
    on=F.expr("o.order_id = i.order_id"),
    how="inner"
)`}
                </pre>
              </div>

              {/* 4. Filter */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Filter Component
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Predicate Pushdown</span>
                </div>
                <p className="text-xs text-slate-300">
                  Applies boolean filter conditions and parameter variable substitution.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Transpiled PySpark equivalent
df_filtered = df_orders.filter(
    (F.col("order_status") != "CANCELLED") & 
    (F.col("order_date") >= F.col("start_date"))
)`}
                </pre>
              </div>

              {/* 5. Aggregate */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Aggregate Component
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">GROUP BY Summaries</span>
                </div>
                <p className="text-xs text-slate-300">
                  Groups rows by dimension keys and computes metrics like SUM, AVG, COUNT, MIN, MAX.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Transpiled PySpark equivalent
df_customer_metrics = df_joined.groupBy("customer_id").agg(
    F.sum("net_price").alias("lifetime_spend"),
    F.count("order_id").alias("total_orders"),
    F.max("order_date").alias("last_order_date")
)`}
                </pre>
              </div>

              {/* 6. Window / Rank */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" />
                    Rank / Window Component
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Window Specifications</span>
                </div>
                <p className="text-xs text-slate-300">
                  Calculates row numbers, rank, dense rank, lead, lag, and running totals over partitioned windows.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Transpiled PySpark equivalent
win_spec = Window.partitionBy("country").orderBy(F.col("lifetime_spend").desc())
df_ranked = df_customers.withColumn("regional_rank", F.row_number().over(win_spec))`}
                </pre>
              </div>

              {/* 7. Flatten Variant (JSON Parsing) */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-rose-400" />
                    Flatten Variant Component
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Semi-Structured Data</span>
                </div>
                <p className="text-xs text-slate-300">
                  Unpacks Snowflake VARIANT, array elements, or JSON objects into structured tabular columns.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Transpiled PySpark equivalent
payload_schema = T.StructType([
    T.StructField("device", T.StringType(), True),
    T.StructField("ip", T.StringType(), True)
])
df_parsed = df_raw.withColumn("parsed_payload", F.from_json("raw_payload", payload_schema))`}
                </pre>
              </div>

              {/* 8. Table Output / Delta MERGE */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Table Output (Delta MERGE / SCD2)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">ACID Lakehouse Write</span>
                </div>
                <p className="text-xs text-slate-300">
                  Persists transformed records to Delta Lake using ACID atomic upserts, preventing duplicates and enabling historical time-travel.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Transpiled PySpark equivalent: Atomic Delta MERGE
target_table = DeltaTable.forName(spark, "gold_analytics.crm.customer_dim")
target_table.alias("t").merge(
    df_customer_metrics.alias("s"),
    "t.customer_id = s.customer_id"
).whenMatchedUpdateAll() \\
 .whenNotMatchedInsertAll() \\
 .execute()`}
                </pre>
              </div>

            </div>
          </div>
        )}

        {/* SUB-MENU 5: BATCH OPTIMIZER & FILE SIZING */}
        {activeSection === 'batch-optimizer' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                <span>PERFORMANCE ENGINE</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Batch Optimizer: Auto-Partitioning &amp; File Sizing
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                How MatConvDBX.ai.studio dynamically computes optimal partition layouts, Delta file sizes, and Adaptive Query Execution configs based on input data volume.
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-amber-950/20 to-orange-950/10 border border-amber-500/30 rounded-xl space-y-2">
              <span className="font-bold text-amber-300 text-xs block">The "Small Files Problem" in Migrated Pipelines</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Traditional data warehouses handle tiny files transparently through background consolidation. In Apache Spark and cloud object storage, having millions of small &lt; 10MB files severely degrades query performance and increases cloud metadata costs. The <strong>Batch Optimizer</strong> toggle solves this by injecting workload-aware file sizing and partitioning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Small Volumes (&lt; 10 GB)</span>
                <p className="text-slate-400">
                  Target file size set to <strong>64 MB</strong>. Partitions are unpartitioned to prevent creating empty or microscopic files. AQE coalescing is enabled.
                </p>
                <code className="block p-2 bg-slate-950 rounded text-cyan-300 text-[10px] font-mono">
                  spark.conf.set("spark.databricks.delta.targetFileSize", "67108864")
                </code>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Medium Volumes (10 GB - 250 GB)</span>
                <p className="text-slate-400">
                  Target file size set to <strong>128 MB</strong> with auto-compaction and optimize write enabled. Single-column liquid clustering applied.
                </p>
                <code className="block p-2 bg-slate-950 rounded text-cyan-300 text-[10px] font-mono">
                  spark.conf.set("spark.databricks.delta.targetFileSize", "134217728")
                </code>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Large Volumes (250 GB - 2 TB)</span>
                <p className="text-slate-400">
                  Target file size set to <strong>256 MB</strong>. Databricks Liquid Clustering (<code className="text-amber-300">CLUSTER BY</code>) active on multiple key dimensions.
                </p>
                <code className="block p-2 bg-slate-950 rounded text-cyan-300 text-[10px] font-mono">
                  spark.conf.set("spark.databricks.delta.targetFileSize", "268435456")
                </code>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Massive Enterprise Volumes (&gt; 2 TB)</span>
                <p className="text-slate-400">
                  Target file size set to <strong>512 MB</strong>. Adaptive skew join mitigations active, shuffle partitions dynamically coalesced.
                </p>
                <code className="block p-2 bg-slate-950 rounded text-cyan-300 text-[10px] font-mono">
                  spark.conf.set("spark.databricks.delta.targetFileSize", "536870912")
                </code>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MENU 6: SCHEMA VALIDATION */}
        {activeSection === 'schema-validation' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                <span>DATA TYPE GOVERNANCE</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Schema Validation &amp; Type-Mismatch Prevention
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Eliminating runtime pipeline failures through proactive source and target data type auditing.
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs leading-relaxed">
              <p className="text-slate-300">
                During Matillion conversions, silent schema incompatibilities between Snowflake/Redshift and PySpark/Delta Lake can cause silent data corruption or pipeline termination. The <strong>Schema Validation Preview</strong> in MatillionInspector proactively maps and scores each column:
              </p>
              
              <div className="space-y-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-amber-500/30 flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">⚠</span>
                  <div>
                    <span className="font-bold text-amber-300">TIMESTAMP_NTZ vs Session Timezone:</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Snowflake TIMESTAMP_NTZ has no session timezone. Spark TimestampType assumes the session timezone by default, causing potential offset drift unless Databricks Runtime 13.3+ TimestampNTZType is used.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-amber-500/30 flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">⚠</span>
                  <div>
                    <span className="font-bold text-amber-300">NUMBER(38, 0) Integer Overflow:</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Snowflake allows 38-digit numbers. Casting to PySpark 64-bit LongType can cause overflow if values exceed 9.22 × 10¹⁸. MatConvDBX automatically suggests <code className="text-cyan-300">T.DecimalType(38, 0)</code> for safety.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-rose-500/30 flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">🚨</span>
                  <div>
                    <span className="font-bold text-rose-300">Semi-Structured VARIANT / JSON:</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Snowflake allows dynamic dot-notation traversal on VARIANT columns without explicit schemas. PySpark requires <code className="text-cyan-300">F.from_json()</code> with an explicit StructType to prevent catastrophic schema evolution overhead.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MENU 7: COMPLEXITY SCORE */}
        {activeSection === 'complexity-score' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                <span>SCORING ALGORITHM</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Conversion Complexity Scoring Engine
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                How MatConvDBX evaluates job migration difficulty and estimates automated vs manual engineering hours.
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
              <p className="text-slate-300">
                The Conversion Complexity Score (0 - 100) quantifies the architectural weight of the current Matillion job by assessing 5 key dimensions:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-300 block mb-1">1. Component Volume &amp; Diversity</span>
                  <p className="text-slate-400 text-[11px]">
                    Base weight calculated from total component count plus unique transformation types present in the pipeline.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-bold text-purple-300 block mb-1">2. Advanced Operator Weights</span>
                  <p className="text-slate-400 text-[11px]">
                    High-cardinality Joins (+6 pts each), Window specifications (+5 pts), Hash aggregations (+4 pts), and SCD2 merges (+8 pts).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-bold text-amber-300 block mb-1">3. DAG Topological Branching</span>
                  <p className="text-slate-400 text-[11px]">
                    Identifies fork-join diamonds and multi-consumer DataFrames requiring Spark caching (<code className="text-cyan-300">.cache()</code>).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-bold text-emerald-300 block mb-1">4. Runtime Parameter Scope</span>
                  <p className="text-slate-400 text-[11px]">
                    Evaluates environment and grid variables requiring dynamic Databricks widget binding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MENU 8: DLT */}
        {activeSection === 'dlt' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                <span>DECLARATIVE PIPELINES</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Delta Live Tables (DLT) &amp; Streaming
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Generate production-ready declarative DLT pipelines with automated graph lineage, SCD Type 2 CDC, and data quality expectations.
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Selecting <strong>DLT Mode</strong> in MatConvDBX converts Matillion transformation jobs into declarative Python syntax (<code className="text-cyan-300">@dlt.table</code> and <code className="text-cyan-300">@dlt.view</code>). The Databricks DLT runtime automatically resolves execution order, manages checkpointing, and guarantees idempotency.
              </p>

              <pre className="p-3 bg-slate-950 rounded-lg text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`import dlt
import pyspark.sql.functions as F

@dlt.table(
    name="silver_orders_clean",
    comment="Cleaned orders with expectation enforcement"
)
@dlt.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dlt.expect("positive_amount", "total_amount > 0")
def silver_orders():
    return dlt.read("bronze_orders_raw").filter(F.col("status") != "CANCELLED")`}
              </pre>
            </div>
          </div>
        )}

        {/* SUB-MENU 9: UNITY CATALOG */}
        {activeSection === 'unity-catalog' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                <span>GOVERNANCE &amp; SECURITY</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Unity Catalog 3-Level Governance
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Migrating from 2-level database schemas into standardized Unity Catalog 3-level namespaces (<code className="text-cyan-300">catalog.schema.table</code>).
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
              <p className="text-slate-300">
                Unity Catalog is the universal governance layer for data and AI on Databricks. MatConvDBX automatically qualifies all table reads and writes using the 3-level namespace:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300">
                <span>gold_analytics.customer_intelligence.dim_customers</span>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MENU 10: DAB */}
        {activeSection === 'dab' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
                <span>DEVOPS &amp; CI/CD</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Databricks Asset Bundles (DABs) &amp; CLI
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Deploying converted jobs as infrastructure-as-code using modern Databricks Asset Bundles.
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
              <p className="text-slate-300">
                MatConvDBX outputs a complete <code className="text-orange-400">databricks.yml</code> asset bundle definition. You can deploy it directly via the Databricks CLI:
              </p>
              <pre className="p-3 bg-slate-950 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`# Validate and deploy via Databricks CLI
databricks bundle validate
databricks bundle deploy -t prod
databricks bundle run matillion_migration_job`}
              </pre>
            </div>
          </div>
        )}

        {/* SUB-MENU 11: FUNCTIONS */}
        {activeSection === 'functions' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                <span>FUNCTION DICTIONARY</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                SQL to PySpark Function Translation Matrix
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Standard warehouse SQL functions automatically translated into PySpark <code className="text-cyan-300">F.*</code> expressions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {FUNCTION_MAPPINGS.map((fn, idx) => (
                <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-amber-300 font-semibold">{fn.matillionOrSql}</span>
                    <span className="text-[10px] text-slate-400">{fn.category}</span>
                  </div>
                  <div className="font-mono text-cyan-300 font-semibold">{fn.pysparkEquivalent}</div>
                  <p className="text-[11px] text-slate-400">{fn.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-MENU 12: FAQ */}
        {activeSection === 'faq' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                <span>KNOWLEDGE BASE</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Migration FAQ &amp; Best Practices
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Frequently asked migration questions from enterprise data engineering teams.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-white block">Q: Does the converter preserve execution ordering?</span>
                <p className="text-slate-300 leading-relaxed">
                  Yes! MatConvDBX performs a topological sort on all job components and DAG links to guarantee that upstream dependencies execute prior to downstream consumers.
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-white block">Q: How are Matillion Grid Variables translated?</span>
                <p className="text-slate-300 leading-relaxed">
                  Grid variables are converted into structured PySpark list collections or DataFrames, and unpacked dynamically inside loop constructs.
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-white block">Q: Can I run the generated code in Databricks Community Edition?</span>
                <p className="text-slate-300 leading-relaxed">
                  Yes, the generated PySpark notebooks use standard Apache Spark 3.5+ and Delta Lake 3.0+ APIs that run out of the box on any Databricks runtime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MENU 13: CONTACTS */}
        {activeSection === 'contacts-info' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
                <span>SUPPORT &amp; COMMUNITY</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Contacts, Team &amp; General Info
              </h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Connect with the engineering maintainers of MatConvDBX.ai.studio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Lead Architect &amp; Maintainer</span>
                <p className="text-slate-300">Bharathi Srihari</p>
                <div className="flex items-center gap-2 text-purple-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>bharathi.srihari@gmail.com</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Project Identity</span>
                <p className="text-slate-300">MatConvDBX.ai.studio</p>
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cloud Lakehouse Migration Framework</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* GCP Console-Style Right-Side Sub-Headings Panel */}
      <aside className="w-64 md:w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
        
        {/* Right Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Sub-Headings</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {filteredSubHeadings.length}
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Filter topics..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Sub-Headings Click List */}
        <div className="p-2 space-y-1 flex-1 overflow-y-auto">
          {filteredSubHeadings.map(sh => {
            const Icon = sh.icon;
            const isActive = activeSection === sh.id;
            return (
              <button
                key={sh.id}
                onClick={() => setActiveSection(sh.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{sh.title}</span>
                </div>
                <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${
                  isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                }`} />
              </button>
            );
          })}
        </div>

        {/* Quick Launch Studio Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onNavigateToStudio}
            className="w-full py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Converter Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </aside>

    </div>
  );
};
