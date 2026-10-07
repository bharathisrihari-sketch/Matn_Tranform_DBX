import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Search, 
  FileCode, 
  Terminal, 
  Layers, 
  Cpu, 
  Columns,
  Sparkles,
  ArrowRightLeft,
  Info,
  CheckCircle2,
  FileDiff
} from 'lucide-react';
import { ConvertedOutput, MatillionComponent } from '../types/matillion';
import { computeSideBySideDiff } from '../services/diffGenerator';

interface CodeViewerProps {
  output: ConvertedOutput;
  jobName: string;
  selectedComponent: MatillionComponent | null;
  targetOutputFormat?: 'notebook' | 'script' | 'dlt' | 'workflow';
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  output,
  jobName,
  selectedComponent,
  targetOutputFormat
}) => {
  const [activeTab, setActiveTab] = useState<'notebook' | 'script' | 'dlt' | 'workflow'>(
    targetOutputFormat || 'notebook'
  );
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Side-by-side Diff Mode State
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [diffBaseFormat, setDiffBaseFormat] = useState<'notebook' | 'script'>('notebook');
  const [filterChangedOnly, setFilterChangedOnly] = useState(false);

  React.useEffect(() => {
    if (targetOutputFormat) {
      setActiveTab(targetOutputFormat);
    }
  }, [targetOutputFormat]);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'notebook': return output.notebookCode;
      case 'script': return output.scriptCode;
      case 'dlt': return output.dltCode;
      case 'workflow': return output.workflowJson;
    }
  };

  const getFilename = () => {
    const clean = jobName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (isDiffMode) {
      return `${clean}_pyspark_vs_dlt_diff.py`;
    }
    switch (activeTab) {
      case 'notebook': return `${clean}_notebook.py`;
      case 'script': return `${clean}_script.py`;
      case 'dlt': return `${clean}_dlt_pipeline.py`;
      case 'workflow': return `${clean}_job.json`;
    }
  };

  const handleCopy = () => {
    if (isDiffMode) {
      const combined = `# --- Standard PySpark (${diffBaseFormat}) ---\n${
        diffBaseFormat === 'notebook' ? output.notebookCode : output.scriptCode
      }\n\n# --- Delta Live Tables (DLT) ---\n${output.dltCode}`;
      navigator.clipboard.writeText(combined);
    } else {
      navigator.clipboard.writeText(getActiveCode());
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = isDiffMode 
      ? `# ==========================================\n# PySpark vs Delta Live Tables (DLT) Diff\n# Job: ${jobName}\n# ==========================================\n\n# --- STANDARD PYSPARK ---\n${
          diffBaseFormat === 'notebook' ? output.notebookCode : output.scriptCode
        }\n\n# --- DELTA LIVE TABLES (DLT) ---\n${output.dltCode}`
      : getActiveCode();
    const filename = getFilename();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Compute diff between base PySpark (Notebook or Script) and DLT code
  const basePysparkCode = diffBaseFormat === 'notebook' ? output.notebookCode : output.scriptCode;
  const diffLines = useMemo(() => {
    return computeSideBySideDiff(basePysparkCode, output.dltCode);
  }, [basePysparkCode, output.dltCode]);

  // Count changed lines
  const changedLinesCount = useMemo(() => {
    return diffLines.filter(d => d.type === 'modified' || d.type === 'added' || d.type === 'removed').length;
  }, [diffLines]);

  const displayedDiffLines = useMemo(() => {
    if (!filterChangedOnly) return diffLines;
    return diffLines.filter(d => d.type === 'modified' || d.type === 'added' || d.type === 'removed');
  }, [diffLines, filterChangedOnly]);

  const singleCode = getActiveCode();
  const singleLines = singleCode.split('\n');

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Tab Switcher & Diff Mode Toggle Actions */}
      <div className="h-12 border-b border-slate-800 bg-slate-950 px-3 sm:px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          
          {/* Individual Format Tabs (Active when not in full Diff Mode or used to toggle format) */}
          <button
            onClick={() => {
              setActiveTab('notebook');
              if (isDiffMode) setDiffBaseFormat('notebook');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isDiffMode && activeTab === 'notebook'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-orange-400" />
            <span>Notebook</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('script');
              if (isDiffMode) setDiffBaseFormat('script');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isDiffMode && activeTab === 'script'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>PySpark Script</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('dlt');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isDiffMode && activeTab === 'dlt'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Delta Live Tables (DLT)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('workflow');
              setIsDiffMode(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isDiffMode && activeTab === 'workflow'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Workflow JSON</span>
          </button>

          {/* Dedicated Side-by-Side Diff Mode Toggle */}
          <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

          <button
            onClick={() => setIsDiffMode(!isDiffMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isDiffMode
                ? 'bg-gradient-to-r from-orange-500/20 to-cyan-500/20 text-white border-cyan-500/50 shadow-sm shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
            title="Side-by-side diff comparing standard PySpark vs Delta Live Tables"
          >
            <ArrowRightLeft className={`w-3.5 h-3.5 ${isDiffMode ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Side-by-Side Diff</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
              isDiffMode ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
            }`}>
              PySpark ⟷ DLT
            </span>
          </button>
        </div>

        {/* Copy & Download Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Diff Mode Control Sub-bar */}
      {isDiffMode ? (
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <FileDiff className="w-3.5 h-3.5 text-cyan-400" />
              Comparing:
            </span>

            {/* Base Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
              <button
                onClick={() => setDiffBaseFormat('notebook')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  diffBaseFormat === 'notebook'
                    ? 'bg-orange-500/20 text-orange-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PySpark Notebook
              </button>
              <button
                onClick={() => setDiffBaseFormat('script')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  diffBaseFormat === 'script'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PySpark Script
              </button>
            </div>

            <span className="text-slate-600 font-mono">VS</span>

            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Delta Live Tables (DLT)
            </span>
          </div>

          {/* Quick Filter & Syntax Legend */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={filterChangedOnly}
                onChange={(e) => setFilterChangedOnly(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Changed lines only ({changedLinesCount})</span>
            </label>

            {/* Syntax badges legend */}
            <div className="hidden lg:flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                @dlt.table / view
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                dlt.read / dlt.expect
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                Standard spark.read / write
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Single-File Search Header */
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search generated code (e.g. DeltaTable, Window, groupBy)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none w-full text-xs placeholder:text-slate-600"
            />
          </div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
            <span>{singleLines.length} lines</span>
            <span>&bull;</span>
            <span>{getFilename()}</span>
            <button
              onClick={() => setIsDiffMode(true)}
              className="ml-2 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold underline cursor-pointer"
            >
              Compare with DLT
            </button>
          </div>
        </div>
      )}

      {/* Code Display Area */}
      {isDiffMode ? (
        /* SIDE-BY-SIDE DIFF VIEW */
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0F19]">
          {/* Side-by-Side Column Headers */}
          <div className="grid grid-cols-2 bg-slate-950 border-b border-slate-800 text-xs font-semibold select-none">
            <div className="px-4 py-2 border-r border-slate-800 flex items-center justify-between text-orange-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Standard PySpark ({diffBaseFormat === 'notebook' ? 'Notebook' : 'Script'})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">imperative dataframe pipeline</span>
            </div>

            <div className="px-4 py-2 flex items-center justify-between text-cyan-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Delta Live Tables (DLT)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">declarative @dlt decorators</span>
            </div>
          </div>

          {/* Diff Scrollable Container */}
          <div className="flex-1 overflow-auto font-mono text-xs leading-relaxed select-text">
            <div className="min-w-[800px]">
              {displayedDiffLines.map((diff, idx) => {
                const isModified = diff.type === 'modified';
                const isAdded = diff.type === 'added';
                const isRemoved = diff.type === 'removed';
                const isSame = diff.type === 'same';

                const isDltDecorator = diff.textRight.includes('@dlt.table') || 
                  diff.textRight.includes('@dlt.view') || 
                  diff.textRight.includes('dlt.apply_changes');
                const isExpectation = diff.textRight.includes('@dlt.expect') || 
                  diff.textRight.includes('dlt.expect_or_fail');
                const isDltRead = diff.textRight.includes('dlt.read') || 
                  diff.textRight.includes('dlt.read_stream');

                return (
                  <div 
                    key={idx}
                    className={`grid grid-cols-2 border-b border-slate-900/40 hover:bg-slate-800/20 transition-colors ${
                      isModified 
                        ? 'bg-amber-500/10' 
                        : isAdded 
                        ? 'bg-cyan-500/10' 
                        : isRemoved 
                        ? 'bg-rose-500/10' 
                        : ''
                    }`}
                  >
                    {/* LEFT PANEL: Standard PySpark */}
                    <div className="flex border-r border-slate-800 pr-2 overflow-hidden group">
                      <div className="w-10 text-right pr-2 text-slate-600 select-none text-[11px] shrink-0 pt-0.5">
                        {diff.lineNumLeft || ''}
                      </div>
                      <div className="flex-1 py-0.5 px-2 break-all whitespace-pre-wrap text-slate-300">
                        {isModified ? (
                          <span className="text-amber-200 bg-amber-500/20 px-1 py-0.5 rounded">
                            {diff.textLeft || <span className="text-slate-600 italic">-- omitted --</span>}
                          </span>
                        ) : isRemoved ? (
                          <span className="text-rose-300 line-through opacity-80">
                            {diff.textLeft}
                          </span>
                        ) : (
                          <span className={diff.textLeft.trim().startsWith('#') ? 'text-slate-500 italic' : ''}>
                            {diff.textLeft || <span className="opacity-0">.</span>}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RIGHT PANEL: Delta Live Tables (DLT) */}
                    <div className="flex pl-2 overflow-hidden group">
                      <div className="w-10 text-right pr-2 text-slate-600 select-none text-[11px] shrink-0 pt-0.5">
                        {diff.lineNumRight || ''}
                      </div>
                      <div className="flex-1 py-0.5 px-2 break-all whitespace-pre-wrap">
                        {isDltDecorator ? (
                          <span className="text-cyan-300 font-bold bg-cyan-500/20 px-1 py-0.5 rounded border border-cyan-500/30 inline-block">
                            {diff.textRight}
                          </span>
                        ) : isExpectation ? (
                          <span className="text-emerald-300 font-bold bg-emerald-500/20 px-1 py-0.5 rounded border border-emerald-500/30 inline-block">
                            {diff.textRight}
                          </span>
                        ) : isDltRead ? (
                          <span className="text-teal-300 font-semibold bg-teal-500/15 px-1 py-0.5 rounded">
                            {diff.textRight}
                          </span>
                        ) : isModified ? (
                          <span className="text-cyan-200 bg-cyan-500/20 px-1 py-0.5 rounded">
                            {diff.textRight || <span className="text-slate-600 italic">-- declarative definition --</span>}
                          </span>
                        ) : isAdded ? (
                          <span className="text-emerald-300 font-semibold bg-emerald-500/20 px-1 py-0.5 rounded">
                            + {diff.textRight}
                          </span>
                        ) : (
                          <span className={
                            diff.textRight.trim().startsWith('#') 
                              ? 'text-slate-500 italic' 
                              : 'text-slate-300'
                          }>
                            {diff.textRight || <span className="opacity-0">.</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diff Footer Summary */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Highlighting syntax transitions: Imperative PySpark dataframe chains are replaced by declarative <span className="text-cyan-300 font-mono">@dlt.table</span>, <span className="text-cyan-300 font-mono">@dlt.view</span>, and quality expectations.
              </span>
            </div>
            <button
              onClick={() => setIsDiffMode(false)}
              className="text-xs font-medium text-slate-300 hover:text-white underline cursor-pointer"
            >
              Back to Standard View
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD SINGLE-FILE CODE VIEW */
        <div className="flex-1 overflow-auto bg-[#0B0F19] p-4 font-mono text-xs leading-relaxed select-text">
          <table className="w-full border-collapse">
            <tbody>
              {singleLines.map((line, idx) => {
                const lineNum = idx + 1;
                const isCellDivider = line.includes('# COMMAND ----------');
                const isCellMd = line.includes('# MAGIC %md') || line.includes('# MAGIC #');
                const isMatch = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());
                
                // Highlight if this line mentions the selected component
                const isSelectedComponentLine = selectedComponent && (
                  line.includes(`[${selectedComponent.name}]`) || 
                  line.includes(`df_${selectedComponent.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`)
                );

                return (
                  <tr 
                    key={idx} 
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isMatch ? 'bg-amber-500/20' : ''
                    } ${
                      isSelectedComponentLine ? 'bg-orange-500/15' : ''
                    }`}
                  >
                    <td className="w-12 text-right pr-4 text-slate-600 select-none text-[11px] align-top">
                      {lineNum}
                    </td>
                    <td className="text-slate-300 break-all whitespace-pre-wrap">
                      {isCellDivider ? (
                        <span className="text-orange-400 font-bold block border-b border-orange-500/20 py-1">
                          {line}
                        </span>
                      ) : isCellMd ? (
                        <span className="text-sky-300 font-semibold">{line}</span>
                      ) : line.trim().startsWith('#') ? (
                        <span className="text-slate-500 italic">{line}</span>
                      ) : line.includes('def ') || line.includes('class ') ? (
                        <span className="text-amber-300">{line}</span>
                      ) : line.includes('DeltaTable') || line.includes('spark.read') || line.includes('withColumn') || line.includes('groupBy') ? (
                        <span className="text-emerald-300">{line}</span>
                      ) : line.startsWith('@dlt.') ? (
                        <span className="text-cyan-300 font-bold">{line}</span>
                      ) : (
                        line
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
