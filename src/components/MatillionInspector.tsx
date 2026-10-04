import React from 'react';
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
  ArrowRight
} from 'lucide-react';
import { MatillionComponent, MatillionJob, ConversionOptions } from '../types/matillion';

interface MatillionInspectorProps {
  selectedComponent: MatillionComponent | null;
  job: MatillionJob;
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
  onUpdateComponent?: (comp: MatillionComponent) => void;
}

export const MatillionInspector: React.FC<MatillionInspectorProps> = ({
  selectedComponent,
  job,
  options,
  onOptionsChange,
  onUpdateComponent
}) => {
  const [activeTab, setActiveTab] = React.useState<'component' | 'options' | 'variables'>('component');

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Top Tab Bar */}
      <div className="h-12 border-b border-slate-800 bg-slate-950 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('component')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'component'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inspector
          </button>
          <button
            onClick={() => setActiveTab('options')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'options'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Target Settings
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'variables'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Variables ({job.variables.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === 'component' && (
          selectedComponent ? (
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
          )
        )}

        {activeTab === 'options' && (
          <div className="space-y-4 text-xs">
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

        {activeTab === 'variables' && (
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
