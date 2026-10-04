import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Search, 
  FileCode, 
  Terminal, 
  Layers, 
  Cpu, 
  ExternalLink,
  Code2
} from 'lucide-react';
import { ConvertedOutput, MatillionComponent } from '../types/matillion';

interface CodeViewerProps {
  output: ConvertedOutput;
  jobName: string;
  selectedComponent: MatillionComponent | null;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  output,
  jobName,
  selectedComponent
}) => {
  const [activeTab, setActiveTab] = useState<'notebook' | 'script' | 'dlt' | 'workflow'>('notebook');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    switch (activeTab) {
      case 'notebook': return `${clean}_notebook.py`;
      case 'script': return `${clean}_script.py`;
      case 'dlt': return `${clean}_dlt_pipeline.py`;
      case 'workflow': return `${clean}_job.json`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getActiveCode();
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

  const code = getActiveCode();
  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Tab Switcher & Actions */}
      <div className="h-12 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('notebook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'notebook'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Databricks Notebook</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'script'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>PySpark Script</span>
          </button>

          <button
            onClick={() => setActiveTab('dlt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dlt'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Delta Live Tables (DLT)</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'workflow'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Workflow JSON</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Search Header */}
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
        <div className="text-[11px] text-slate-500 font-mono">
          {lines.length} lines &bull; {getFilename()}
        </div>
      </div>

      {/* Code Display Area */}
      <div className="flex-1 overflow-auto bg-[#0B0F19] p-4 font-mono text-xs leading-relaxed select-text">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
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
    </div>
  );
};
