import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Archive, 
  FileCode, 
  Terminal, 
  Layers, 
  Cpu, 
  Check, 
  FileText
} from 'lucide-react';
import JSZip from 'jszip';
import { MatillionJob, ConvertedOutput, ConversionOptions } from '../types/matillion';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: MatillionJob;
  output: ConvertedOutput;
  options: ConversionOptions;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  job,
  output,
  options
}) => {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadedZip, setDownloadedZip] = useState(false);

  if (!isOpen) return null;

  const cleanName = job.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();

      // README
      const readme = `# ${job.name} - Databricks Migration Package
Generated from Matillion ${job.jobType} Job.

## Contents
- \`notebooks/${cleanName}_notebook.py\`: Databricks interactive notebook (import directly into Databricks Workspace).
- \`scripts/${cleanName}_etl.py\`: Modular PySpark batch script.
- \`dlt/${cleanName}_dlt.py\`: Delta Live Tables (DLT) declarative pipeline.
- \`resources/job.json\`: Databricks Workflow Multi-Task Job definition.
- \`databricks.yml\`: Databricks Asset Bundle (DAB) manifest.
- \`requirements.txt\`: PySpark & Delta Lake Python dependencies.

## Quick Start
1. **Workspace Import:**
   Open Databricks Workspace -> Workspace -> Right click -> Import -> Select \`notebooks/${cleanName}_notebook.py\`.
2. **Databricks Asset Bundle (DAB):**
   \`\`\`bash
   databricks bundle deploy
   databricks bundle run ${cleanName}_job
   \`\`\`
3. **Workflow Job Import:**
   Navigate to Workflows -> Jobs -> Create Job -> JSON definition -> Paste \`resources/job.json\`.
`;

      const databricksYml = `bundle:
  name: ${cleanName}_migration

resources:
  jobs:
    ${cleanName}_job:
      name: "[Migrated] ${job.name}"
      tasks:
        - task_key: run_notebook
          notebook_task:
            notebook_path: ./notebooks/${cleanName}_notebook.py
          new_cluster:
            spark_version: "${options.runtimeVersion}.x-scala2.12"
            node_type_id: "i3.xlarge"
            num_workers: 2
`;

      const requirements = `pyspark>=3.5.0
delta-spark>=3.0.0
`;

      // Add files into bundle structure
      zip.file(`notebooks/${cleanName}_notebook.py`, output.notebookCode);
      zip.file(`scripts/${cleanName}_etl.py`, output.scriptCode);
      zip.file(`dlt/${cleanName}_dlt.py`, output.dltCode);
      zip.file(`resources/job.json`, output.workflowJson);
      zip.file('databricks.yml', databricksYml);
      zip.file('requirements.txt', requirements);
      zip.file('README.md', readme);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cleanName}_databricks_bundle.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadedZip(true);
      setTimeout(() => setDownloadedZip(false), 2500);
    } catch (e) {
      console.error('Failed to generate ZIP', e);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <Download className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Converted Databricks Assets</h2>
              <p className="text-xs text-slate-400">Download individual files or the full Databricks Asset Bundle (ZIP)</p>
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
          
          {/* Main Full Bundle Card */}
          <div className="bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-slate-950 border border-orange-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                <Archive className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Complete Databricks Migration Bundle (ZIP)</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Includes Notebook, Modular Script, DLT pipeline, Workflow JSON, DAB <code className="text-orange-300">databricks.yml</code>, and README.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 whitespace-nowrap transition-all"
            >
              {downloadedZip ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{downloadingZip ? 'Packing...' : 'Download ZIP'}</span>
                </>
              )}
            </button>
          </div>

          {/* Individual Files Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Download Specific Artifact
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-orange-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Databricks Notebook</span>
                    <span className="text-[10px] font-mono text-slate-500">{cleanName}_notebook.py</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(`${cleanName}_notebook.py`, output.notebookCode)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  title="Download notebook"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Modular PySpark Script</span>
                    <span className="text-[10px] font-mono text-slate-500">{cleanName}_script.py</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(`${cleanName}_script.py`, output.scriptCode)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  title="Download script"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Delta Live Tables (DLT)</span>
                    <span className="text-[10px] font-mono text-slate-500">{cleanName}_dlt.py</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(`${cleanName}_dlt.py`, output.dltCode)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  title="Download DLT code"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Databricks Workflow JSON</span>
                    <span className="text-[10px] font-mono text-slate-500">{cleanName}_job.json</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(`${cleanName}_job.json`, output.workflowJson)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  title="Download workflow JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
