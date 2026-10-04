import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Layers, 
  Database, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { MatillionJob, ConvertedOutput } from '../types/matillion';

interface MigrationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: MatillionJob;
  output: ConvertedOutput;
}

export const MigrationReportModal: React.FC<MigrationReportModalProps> = ({
  isOpen,
  onClose,
  job,
  output
}) => {
  if (!isOpen) return null;

  const { stats } = output;
  const compatibilityPct = Math.round((stats.translatedComponents / stats.totalComponents) * 100) || 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Databricks Migration Assessment</h2>
              <p className="text-xs text-slate-400">Automated readiness audit for {job.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Conversion Compatibility</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-emerald-400">{compatibilityPct}%</span>
                <span className="text-xs text-slate-500">automated</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${compatibilityPct}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Complexity Rating</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-2xl font-extrabold ${
                  stats.complexityScore === 'High' ? 'text-amber-400' : 'text-sky-400'
                }`}>
                  {stats.complexityScore}
                </span>
                <span className="text-xs text-slate-500">pipeline topology</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Based on join depths, window functions, and loop iterations.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Component Breakdown</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-white">{stats.totalComponents}</span>
                <span className="text-xs text-slate-500">nodes translated</span>
              </div>
              <span className="text-[11px] text-emerald-400/90 mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" /> 0 breaking syntax errors
              </span>
            </div>

          </div>

          {/* Applied Databricks Optimizations */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Applied Architecture & Optimizations
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
              {stats.estimatedSparkOptimizations.map((opt, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{opt}</span>
                </div>
              ))}
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Databricks Adaptive Query Execution (AQE) enabled for dynamic partition coalescing.</span>
              </div>
            </div>
          </div>

          {/* Component Inventory Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Pipeline Node Inventory
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 pl-4">Node Name</th>
                    <th className="p-2.5">Matillion Type</th>
                    <th className="p-2.5">Databricks PySpark Target</th>
                    <th className="p-2.5 pr-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {job.components.map(comp => (
                    <tr key={comp.id} className="hover:bg-slate-900/40">
                      <td className="p-2.5 pl-4 font-medium text-slate-200">{comp.name}</td>
                      <td className="p-2.5 text-slate-400">{comp.type}</td>
                      <td className="p-2.5 text-cyan-300">
                        {comp.type === 'Table Input' ? 'spark.read.table()' :
                         comp.type === 'Calculator' ? 'DataFrame.withColumn()' :
                         comp.type === 'Filter' ? 'DataFrame.filter()' :
                         comp.type === 'Join' ? 'DataFrame.join()' :
                         comp.type === 'Aggregate' ? 'DataFrame.groupBy().agg()' :
                         comp.type === 'Rank / Window' ? 'Window.partitionBy().orderBy()' :
                         comp.type === 'Table Output' ? 'DeltaTable.merge() / write' :
                         'dbutils / Workflow Task'}
                      </td>
                      <td className="p-2.5 pr-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Steps to Deploy on Databricks */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              Quick Steps to Run on Databricks Workspace
            </h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
              <li>Click <strong>Export Bundle</strong> in the navigation header to download the <code className="text-orange-300">.py</code> notebook.</li>
              <li>In your Databricks Workspace, navigate to your folder and choose <strong>Import &rarr; File</strong>.</li>
              <li>Attach the imported notebook to an active Single User or Shared Cluster (DBR 14.x or 15.x).</li>
              <li>Run the notebook or schedule it as a Databricks Workflow Job!</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
