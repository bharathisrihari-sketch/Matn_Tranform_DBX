import React, { useMemo, useState } from 'react';
import { 
  Sliders, 
  Database, 
  Calculator, 
  GitMerge, 
  Layers, 
  Save, 
  Variable, 
  Info,
  CheckCircle,
  FileCode,
  Tag,
  ArrowRight,
  Gauge,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Zap,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Cpu,
  Table
} from 'lucide-react';
import { MatillionComponent, MatillionJob, ConversionOptions, SchemaValidationResult } from '../types/matillion';
import { calculateConversionComplexity, ComplexityResult } from '../services/complexity';
import { validateComponentSchema, getBatchOptimizerRecommendation } from '../services/schemaValidator';

interface MatillionInspectorProps {
  selectedComponent: MatillionComponent | null;
  job: MatillionJob;
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
  onUpdateComponent?: (comp: MatillionComponent) => void;
  activeTab?: 'component' | 'complexity' | 'schema' | 'options' | 'variables';
  onActiveTabChange?: (tab: 'component' | 'complexity' | 'schema' | 'options' | 'variables') => void;
}

export const MatillionInspector: React.FC<MatillionInspectorProps> = ({
  selectedComponent,
  job,
  options,
  onOptionsChange,
  onUpdateComponent,
  activeTab: externalActiveTab,
  onActiveTabChange
}) => {
  const [internalActiveTab, setInternalActiveTab] = React.useState<'component' | 'complexity' | 'schema' | 'options' | 'variables'>('component');
  const [schemaFilter, setSchemaFilter] = useState<'all' | 'risks' | 'high'>('all');
  const [copiedSchema, setCopiedSchema] = useState(false);
  
  const currentTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setTab = (tab: 'component' | 'complexity' | 'schema' | 'options' | 'variables') => {
    if (onActiveTabChange) onActiveTabChange(tab);
    else setInternalActiveTab(tab);
  };

  const complexity: ComplexityResult = useMemo(() => {
    return calculateConversionComplexity(job);
  }, [job]);

  // Schema validation preview calculation for the inspected component or first component
  const targetComponent = selectedComponent || job.components[0];
  const schemaValidation: SchemaValidationResult = useMemo(() => {
    if (!targetComponent) {
      return {
        componentId: 'none',
        componentName: 'No Component',
        componentType: 'Unknown',
        columns: [],
        totalColumns: 0,
        riskCounts: { safe: 0, low: 0, warning: 0, high: 0 },
        overallStatus: 'safe',
        recommendations: []
      };
    }
    return validateComponentSchema(targetComponent, job);
  }, [targetComponent, job]);

  // Batch optimizer live recommendations
  const batchRec = useMemo(() => {
    return getBatchOptimizerRecommendation(options.inputDataVolume, job);
  }, [options.inputDataVolume, job]);

  const copyStructType = () => {
    const structLines = schemaValidation.columns.map(c => 
      `    T.StructField("${c.columnName}", ${c.targetSparkType}, ${c.nullable})`
    ).join(',\n');
    const ddl = `import pyspark.sql.types as T\n\n${targetComponent?.name || 'schema'}_schema = T.StructType([\n${structLines}\n])`;
    navigator.clipboard.writeText(ddl);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Top Tab Bar */}
      <div className="h-12 border-b border-slate-800 bg-slate-950 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setTab('component')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === 'component'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inspector
          </button>
          <button
            onClick={() => setTab('complexity')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'complexity'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>Complexity</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${complexity.badgeBg}`}>
              {complexity.score}
            </span>
          </button>
          <button
            onClick={() => setTab('schema')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'schema'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Schema Preview</span>
            {schemaValidation.riskCounts.warning + schemaValidation.riskCounts.high > 0 ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {schemaValidation.riskCounts.warning + schemaValidation.riskCounts.high} Risks
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Safe
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('options')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === 'options'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setTab('variables')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === 'variables'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vars ({job.variables.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {currentTab === 'component' && (
          <div className="space-y-4">
            {/* Quick Conversion Complexity Card */}
            <div 
              onClick={() => setTab('complexity')}
              className="p-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-sm"
              title="Click for full Conversion Complexity Analysis"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                  Conversion Complexity
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${complexity.badgeBg}`}>
                  {complexity.score}/100 · {complexity.level}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    complexity.score <= 38 ? 'bg-emerald-400' :
                    complexity.score <= 68 ? 'bg-sky-400' :
                    complexity.score <= 84 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${complexity.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{complexity.totalComponents} components · {complexity.uniqueTypesCount} transformation types</span>
                <span className="text-cyan-400 font-medium group-hover:underline flex items-center gap-0.5">
                  Details <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>

            {selectedComponent ? (
              <div className="space-y-4">
                {/* Component Header Card */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-500">{selectedComponent.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {selectedComponent.type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{selectedComponent.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Category: {selectedComponent.category}</p>
                </div>

              {/* Matillion Parameters */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-orange-400" />
                  Matillion Parameters
                </h4>
                
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2 text-xs">
                  {Object.entries(selectedComponent.parameters).map(([key, val]) => (
                    <div key={key} className="border-b border-slate-800/80 pb-2 last:border-b-0 last:pb-0">
                      <span className="text-slate-500 font-mono text-[11px] block">{key}</span>
                      <div className="text-slate-200 font-mono text-xs mt-0.5 break-all">
                        {typeof val === 'object' ? (
                          <pre className="text-[11px] bg-slate-900 p-2 rounded mt-1 overflow-x-auto text-cyan-300">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          String(val)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Databricks PySpark Translation Mapping */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Databricks PySpark Strategy
                </h4>

                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-2 text-slate-300">
                  {selectedComponent.type === 'Table Input' && (
                    <>
                      <p className="text-emerald-300 font-medium">Spark Table Read & Pushdown</p>
                      <p className="text-slate-400">Uses <code className="text-cyan-300">spark.read.table()</code> with column pruning and partition predicate pushdown for optimal I/O.</p>
                    </>
                  )}
                  {selectedComponent.type === 'Calculator' && (
                    <>
                      <p className="text-emerald-300 font-medium">DataFrame Expressions</p>
                      <p className="text-slate-400">Translated SQL expressions to <code className="text-cyan-300">withColumn()</code> with Spark Catalyst optimizer compatibility.</p>
                    </>
                  )}
                  {selectedComponent.type === 'Join' && (
                    <>
                      <p className="text-emerald-300 font-medium">Adaptive Query Execution Join</p>
                      <p className="text-slate-400">Converted join keys to DataFrame join conditions. Databricks AQE dynamically selects broadcast or sort-merge join.</p>
                    </>
                  )}
                  {selectedComponent.type === 'Aggregate' && (
                    <>
                      <p className="text-emerald-300 font-medium">Parallel Distributed GroupBy</p>
                      <p className="text-slate-400">PySpark native <code className="text-cyan-300">groupBy().agg()</code> with memory-efficient hash aggregations.</p>
                    </>
                  )}
                  {selectedComponent.type === 'Table Output' && (
                    <>
                      <p className="text-emerald-300 font-medium">Delta Lake ACID Transaction</p>
                      <p className="text-slate-400">Configured with <code className="text-cyan-300">DeltaTable.merge()</code> to prevent partial writes and ensure exactly-once semantics.</p>
                    </>
                  )}
                  {selectedComponent.type === 'Rank / Window' && (
                    <>
                      <p className="text-emerald-300 font-medium">PySpark Window Specification</p>
                      <p className="text-slate-400">Constructs <code className="text-cyan-300">Window.partitionBy().orderBy()</code> to calculate analytical functions across distributed clusters.</p>
                    </>
                  )}
                  {['File Exists', 'S3 Load', 'SQL Script', 'Run Transformation', 'Webhook Notification'].includes(selectedComponent.type) && (
                    <>
                      <p className="text-emerald-300 font-medium">Databricks Utility & Workflow Task</p>
                      <p className="text-slate-400">Maps Matillion orchestrator steps to Databricks <code className="text-cyan-300">dbutils</code> APIs or Workflow Multi-task nodes.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">No Component Selected</p>
              <p className="text-xs text-slate-500 mt-1">Click any node on the DAG canvas to inspect its configuration and PySpark translation.</p>
            </div>
          )}
        </div>
      )}

        {/* Tab: Dedicated Conversion Complexity Breakdown */}
        {currentTab === 'complexity' && (
          <div className="space-y-4 text-xs">
            {/* Complexity Hero Score Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Assessment</span>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    Conversion Complexity Score
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${complexity.badgeBg}`}>
                  {complexity.level} Complexity
                </span>
              </div>

              {/* Progress gauge bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                    {complexity.score}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ 100</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {complexity.score <= 38 ? 'Seamless 1:1 migration' :
                     complexity.score <= 68 ? 'Automated with optimizations' :
                     complexity.score <= 84 ? 'High analytical complexity' : 'Enterprise grade workflow'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      complexity.score <= 38 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                      complexity.score <= 68 ? 'bg-gradient-to-r from-sky-500 to-cyan-400' :
                      complexity.score <= 84 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                      'bg-gradient-to-r from-rose-500 to-red-400'
                    }`}
                    style={{ width: `${complexity.score}%` }}
                  />
                </div>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                {complexity.summary}
              </p>
            </div>

            {/* Quick Metrics Matrix */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Total Components</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">{complexity.totalComponents}</span>
                <span className="text-[10px] text-slate-500">Pipeline nodes</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Transform Variety</span>
                <span className="text-base font-bold font-mono text-cyan-400 mt-0.5 block">{complexity.uniqueTypesCount}</span>
                <span className="text-[10px] text-slate-500">Distinct operators</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">DAG Dependencies</span>
                <span className="text-base font-bold font-mono text-purple-400 mt-0.5 block">{job.links.length}</span>
                <span className="text-[10px] text-slate-500">Execution links</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Runtime Parameters</span>
                <span className="text-base font-bold font-mono text-orange-400 mt-0.5 block">{job.variables.length}</span>
                <span className="text-[10px] text-slate-500">Widgets & variables</span>
              </div>
            </div>

            {/* Transformation Types Breakdown */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                Transformation Types Found ({complexity.transformationTypes.length})
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
                {complexity.transformationTypes.map((t, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <div>
                        <span className="font-semibold text-slate-200 block text-xs">{t.type}</span>
                        <span className="text-[10px] text-slate-500">{t.category} Category</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        {t.count}x
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Weight: {t.weight >= 8 ? 'High' : t.weight >= 6 ? 'Medium' : 'Standard'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Calculation Factors */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Score Calculation Factors
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2.5">
                {complexity.factors.map((f, i) => (
                  <div key={i} className="flex items-start justify-between border-b border-slate-800/60 pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{f.name}</div>
                      <div className="text-[10px] text-slate-400">{f.description}</div>
                    </div>
                    <div className="font-mono text-xs font-bold text-cyan-300 whitespace-nowrap ml-2">
                      +{f.subtotal} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Databricks Target Recommendations */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Target Databricks Strategy
              </h4>
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                {complexity.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'schema' && (
          <div className="space-y-4 text-xs">
            {/* Header / Inspected Component Info */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">{schemaValidation.componentName}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {schemaValidation.componentType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Source: <span className="text-slate-200 font-semibold">{job.targetPlatform || 'Snowflake'}</span> → Target: <span className="text-cyan-400 font-semibold">Databricks PySpark & Delta Lake</span>
              </p>
            </div>

            {/* Overall Status Banner */}
            <div className={`p-3 rounded-xl border flex items-start gap-3 ${
              schemaValidation.overallStatus === 'critical'
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                : schemaValidation.overallStatus === 'warning'
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            }`}>
              {schemaValidation.overallStatus === 'critical' ? (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : schemaValidation.overallStatus === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold text-xs mb-0.5">
                  {schemaValidation.overallStatus === 'critical'
                    ? 'Critical Type-Mismatch Risks Detected'
                    : schemaValidation.overallStatus === 'warning'
                    ? 'Schema Compatibility Warnings Present'
                    : 'Schema Fully Compatible With Delta Lake'}
                </div>
                <p className="text-[11px] opacity-90">
                  {schemaValidation.overallStatus === 'critical'
                    ? 'Semi-structured VARIANT or complex columns require explicit PySpark schema definition to prevent runtime schema inference failures.'
                    : schemaValidation.overallStatus === 'warning'
                    ? 'Identified potential precision or timezone drift risks (TIMESTAMP_NTZ / NUMBER overflow). See mitigation recommendations below.'
                    : 'All column data types convert cleanly to native PySpark types with zero precision loss.'}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <div className="font-mono text-sm font-bold text-white">{schemaValidation.totalColumns}</div>
                <div className="text-[10px] text-slate-400">Columns</div>
              </div>
              <div className="p-2 bg-emerald-950/20 rounded-lg border border-emerald-500/30">
                <div className="font-mono text-sm font-bold text-emerald-400">{schemaValidation.riskCounts.safe}</div>
                <div className="text-[10px] text-emerald-300">Safe</div>
              </div>
              <div className="p-2 bg-amber-950/20 rounded-lg border border-amber-500/30">
                <div className="font-mono text-sm font-bold text-amber-400">{schemaValidation.riskCounts.warning}</div>
                <div className="text-[10px] text-amber-300">Warnings</div>
              </div>
              <div className="p-2 bg-rose-950/20 rounded-lg border border-rose-500/30">
                <div className="font-mono text-sm font-bold text-rose-400">{schemaValidation.riskCounts.high}</div>
                <div className="text-[10px] text-rose-300">High Risk</div>
              </div>
            </div>

            {/* Filter and Actions Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSchemaFilter('all')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                    schemaFilter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({schemaValidation.totalColumns})
                </button>
                <button
                  onClick={() => setSchemaFilter('risks')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                    schemaFilter === 'risks'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Risks Only ({schemaValidation.riskCounts.low + schemaValidation.riskCounts.warning + schemaValidation.riskCounts.high})
                </button>
                <button
                  onClick={() => setSchemaFilter('high')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                    schemaFilter === 'high'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  High Risk ({schemaValidation.riskCounts.high})
                </button>
              </div>

              <button
                onClick={copyStructType}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Copy schema as PySpark StructType code"
              >
                {copiedSchema ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedSchema ? 'Copied DDL' : 'Copy StructType'}</span>
              </button>
            </div>

            {/* Columns Mapping Table */}
            <div className="space-y-2">
              {schemaValidation.columns
                .filter(col => {
                  if (schemaFilter === 'high') return col.riskLevel === 'high';
                  if (schemaFilter === 'risks') return col.riskLevel !== 'safe';
                  return true;
                })
                .map((col, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      col.riskLevel === 'high'
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : col.riskLevel === 'warning'
                        ? 'bg-amber-950/15 border-amber-500/30'
                        : col.riskLevel === 'low'
                        ? 'bg-blue-950/15 border-blue-500/30'
                        : 'bg-slate-950 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{col.columnName}</span>
                        {col.nullable && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">null</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        col.riskLevel === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : col.riskLevel === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : col.riskLevel === 'low'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {col.riskLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-1.5">
                      <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 font-mono">
                        <span className="text-[9px] text-slate-400 block font-sans">Source ({job.targetPlatform || 'Warehouse'}):</span>
                        <span className="text-amber-300 font-semibold">{col.sourceType}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 font-mono">
                        <span className="text-[9px] text-slate-400 block font-sans">Target PySpark:</span>
                        <span className="text-cyan-300 font-semibold">{col.targetSparkType}</span>
                      </div>
                    </div>

                    {col.riskReason && (
                      <div className="text-[10px] text-slate-300 mt-1 flex items-start gap-1.5 bg-slate-900/60 p-2 rounded-lg">
                        <span className="text-amber-400 font-bold shrink-0">⚠</span>
                        <div>
                          <p>{col.riskReason}</p>
                          {col.recommendedMitigation && (
                            <p className="text-cyan-300 mt-1 font-mono text-[9px]">
                              Mitigation: {col.recommendedMitigation}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Recommendations Footer */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-200 block uppercase tracking-wider">
                Type Mitigation Recommendations
              </span>
              {schemaValidation.recommendations.map((rec, i) => (
                <div key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'options' && (
          <div className="space-y-4 text-xs">
            {/* Target Output Format Selection */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span>Target Output Format</span>
                {options.outputFormat === 'dlt' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    DLT Active
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOptionsChange({ ...options, outputFormat: 'notebook' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    options.outputFormat === 'notebook'
                      ? 'border-orange-500 bg-orange-500/15 text-white font-semibold ring-1 ring-orange-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-medium">Standard Notebook</span>
                  <span className="text-[10px] text-slate-500">Databricks .py notebook</span>
                </button>

                <button
                  onClick={() => onOptionsChange({ ...options, outputFormat: 'dlt' })}
                  className={`p-2.5 rounded-lg border text-left transition-all relative ${
                    options.outputFormat === 'dlt'
                      ? 'border-cyan-500 bg-cyan-500/15 text-white font-semibold ring-1 ring-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="block font-medium text-cyan-300">Delta Live Tables</span>
                  </div>
                  <span className="text-[10px] text-slate-500">DLT @dlt.table / @dlt.view</span>
                </button>

                <button
                  onClick={() => onOptionsChange({ ...options, outputFormat: 'script' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    options.outputFormat === 'script'
                      ? 'border-orange-500 bg-orange-500/15 text-white font-semibold ring-1 ring-orange-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-medium">Modular Script</span>
                  <span className="text-[10px] text-slate-500">PySpark CLI batch script</span>
                </button>

                <button
                  onClick={() => onOptionsChange({ ...options, outputFormat: 'workflow' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    options.outputFormat === 'workflow'
                      ? 'border-orange-500 bg-orange-500/15 text-white font-semibold ring-1 ring-orange-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-medium">Workflow JSON</span>
                  <span className="text-[10px] text-slate-500">DAB Multi-task spec</span>
                </button>
              </div>
            </div>

            {/* DLT-Specific Settings Panel when DLT is selected */}
            {options.outputFormat === 'dlt' && (
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Delta Live Tables Settings
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">Declarative DAG</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    DLT Expectation Data Quality Rule
                  </label>
                  <select
                    value={options.dltExpectationsMode}
                    onChange={(e) => onOptionsChange({ ...options, dltExpectationsMode: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="drop">@dlt.expect_or_drop (Drop invalid rows)</option>
                    <option value="fail">@dlt.expect_or_fail (Fail pipeline on violation)</option>
                    <option value="warn">@dlt.expect (Log metrics only, keep row)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    DLT Pipeline Execution Mode
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => onOptionsChange({ ...options, dltPipelineType: 'triggered' })}
                      className={`p-1.5 rounded border text-center transition-all ${
                        options.dltPipelineType === 'triggered'
                          ? 'border-cyan-500 bg-cyan-500/20 text-white font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      Triggered (Batch)
                    </button>
                    <button
                      onClick={() => onOptionsChange({ ...options, dltPipelineType: 'continuous' })}
                      className={`p-1.5 rounded border text-center transition-all ${
                        options.dltPipelineType === 'continuous'
                          ? 'border-cyan-500 bg-cyan-500/20 text-white font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      Continuous (Stream)
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-cyan-300 font-medium">Automatic CDC:</span> Matillion SCD Type 2 merges are converted directly into native <code className="text-amber-300">dlt.apply_changes(stored_as_scd_type=2)</code>!
                </div>
              </div>
            )}

            {/* Batch Optimizer Configuration Section */}
            <div className="p-3 bg-gradient-to-br from-amber-950/25 to-orange-950/15 border border-amber-500/35 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">Batch Optimizer</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Auto-Tuning
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.batchOptimizer}
                    onChange={(e) => onOptionsChange({ ...options, batchOptimizer: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Enables automatic partitioning and file sizing recommendations based on the job's input data volume metadata.
              </p>

              {options.batchOptimizer && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Input Data Volume Metadata
                    </label>
                    <select
                      value={options.inputDataVolume || 'medium'}
                      onChange={(e) => onOptionsChange({ ...options, inputDataVolume: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-200 text-xs focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="small">&lt; 10 GB (Small - Coalesce &amp; 64MB Partitions)</option>
                      <option value="medium">10 GB - 250 GB (Medium - Auto-Compact &amp; 128MB Partitions)</option>
                      <option value="large">250 GB - 2 TB (Large - Liquid Clustering &amp; 256MB Partitions)</option>
                      <option value="massive">&gt; 2 TB (Massive Enterprise - Multi-Col Cluster &amp; 512MB)</option>
                    </select>
                  </div>

                  {/* Live Recommendation Badge & Breakdown */}
                  <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Target File Size:</span>
                      <span className="font-mono text-amber-300 font-bold">{batchRec.targetFileSizeMB} MB ({batchRec.targetFileSizeBytes.toLocaleString()} bytes)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Partitioning Strategy:</span>
                      <span className="font-mono text-cyan-300 text-[10px] text-right truncate max-w-[170px]" title={batchRec.partitionStrategy}>
                        {batchRec.partitionStrategy}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Auto Compaction:</span>
                      <span className="font-mono text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Optimize Write:</span>
                      <span className="font-mono text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>AQE Coalesce:</span>
                      <span className="font-mono text-emerald-400 font-bold">Enabled</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Catalog Architecture</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOptionsChange({ ...options, useUnityCatalog: true })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    options.useUnityCatalog
                      ? 'border-orange-500 bg-orange-500/10 text-white font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <span className="block font-medium">Unity Catalog</span>
                  <span className="text-[10px] text-slate-500">catalog.schema.table</span>
                </button>
                <button
                  onClick={() => onOptionsChange({ ...options, useUnityCatalog: false })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    !options.useUnityCatalog
                      ? 'border-orange-500 bg-orange-500/10 text-white font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <span className="block font-medium">Hive Metastore</span>
                  <span className="text-[10px] text-slate-500">schema.table</span>
                </button>
              </div>
            </div>

            {options.useUnityCatalog && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">Default Catalog Name</label>
                <input
                  type="text"
                  value={options.catalogName}
                  onChange={(e) => onOptionsChange({ ...options, catalogName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-medium mb-1">Default Schema / Database</label>
              <input
                type="text"
                value={options.schemaName}
                onChange={(e) => onOptionsChange({ ...options, schemaName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Delta Lake Write Strategy</label>
              <select
                value={options.deltaWriteMode}
                onChange={(e) => onOptionsChange({ ...options, deltaWriteMode: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-medium text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="merge">Delta MERGE (Upsert by Key)</option>
                <option value="overwrite">Overwrite Table / Partition</option>
                <option value="append">Append (Insert Only)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.useLiquidClustering}
                  onChange={(e) => onOptionsChange({ ...options, useLiquidClustering: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0"
                />
                <span className="text-slate-300 font-medium">Enable Databricks Liquid Clustering</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1 pl-6">
                Applies <code className="text-cyan-400">CLUSTER BY</code> to Delta tables, replacing legacy manual partitioning and Z-ORDER.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Databricks Runtime (DBR)</label>
              <select
                value={options.runtimeVersion}
                onChange={(e) => onOptionsChange({ ...options, runtimeVersion: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-medium text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="15.4">DBR 15.4 LTS (Apache Spark 3.5.0)</option>
                <option value="14.3">DBR 14.3 LTS (Apache Spark 3.5.0)</option>
                <option value="13.3">DBR 13.3 LTS (Apache Spark 3.4.1)</option>
              </select>
            </div>
          </div>
        )}

        {currentTab === 'variables' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Mapped to <code className="text-orange-400">dbutils.widgets</code>
              </span>
            </div>

            {job.variables.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No variables defined in this job.</p>
            ) : (
              job.variables.map((v, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-orange-300">{v.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {v.datatype}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Default: <span className="text-slate-200">"{v.defaultValue}"</span>
                  </div>
                  {v.description && (
                    <p className="text-[11px] text-slate-500">{v.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
