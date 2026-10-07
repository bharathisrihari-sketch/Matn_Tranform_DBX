import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Archive, 
  FileCode2, 
  CheckCircle2, 
  Play, 
  Layers, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Check, 
  AlertCircle,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import JSZip from 'jszip';
import { SAMPLE_JOBS } from '../data/samples';
import { MatillionJob, ConversionOptions } from '../types/matillion';
import { convertMatillionJob } from '../services/converter';

interface TestCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadJob: (job: MatillionJob) => void;
  currentOptions: ConversionOptions;
}

interface TestResult {
  jobId: string;
  jobName: string;
  notebookPassed: boolean;
  dltPassed: boolean;
  componentsCount: number;
  durationMs: number;
}

export const TestCenterModal: React.FC<TestCenterModalProps> = ({
  isOpen,
  onClose,
  onLoadJob,
  currentOptions
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'import-zip' | 'test-suite'>('downloads');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadedZipSuccess, setDownloadedZipSuccess] = useState(false);
  const [downloadedSingleId, setDownloadedSingleId] = useState<string | null>(null);

  // ZIP import state
  const [isUnzipping, setIsUnzipping] = useState(false);
  const [unzippedJobs, setUnzippedJobs] = useState<MatillionJob[]>([]);
  const [zipError, setZipError] = useState<string | null>(null);

  // Test suite execution state
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  if (!isOpen) return null;

  // Generate & download full sample ZIP archive
  const handleDownloadSampleZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("matillion_sample_jobs");

      const manifest = {
        exportedAt: new Date().toISOString(),
        version: "1.4.0",
        format: "Matillion ETL Project Export",
        jobsCount: SAMPLE_JOBS.length,
        jobs: SAMPLE_JOBS.map(j => ({
          id: j.id,
          name: j.name,
          type: j.jobType,
          components: j.components.length
        }))
      };

      folder?.file("manifest.json", JSON.stringify(manifest, null, 2));

      SAMPLE_JOBS.forEach(sample => {
        const filename = `${sample.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.json`;
        folder?.file(filename, JSON.stringify(sample, null, 2));
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `matillion_sample_jobs_bundle.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadedZipSuccess(true);
      setTimeout(() => setDownloadedZipSuccess(false), 2500);
    } catch (err: any) {
      console.error("Failed to generate ZIP", err);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Download individual sample JSON
  const handleDownloadSingleJson = (sample: MatillionJob) => {
    const filename = `${sample.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.json`;
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedSingleId(sample.id);
    setTimeout(() => setDownloadedSingleId(null), 2000);
  };

  // Handle uploaded ZIP file and parse inner JSON files
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUnzipping(true);
    setZipError(null);
    setUnzippedJobs([]);

    try {
      const zip = await JSZip.loadAsync(file);
      const foundJobs: MatillionJob[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.json') && !relativePath.includes('manifest.json')) {
          try {
            const textContent = await zipEntry.async('string');
            const parsed = JSON.parse(textContent);

            if (parsed.components && Array.isArray(parsed.components)) {
              foundJobs.push({
                id: parsed.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                name: parsed.name || relativePath.replace(/^.*[\\/]/, '').replace('.json', ''),
                jobType: parsed.jobType || (parsed.name?.toLowerCase().includes('orch') ? 'Orchestration' : 'Transformation'),
                description: parsed.description || `Imported from ${relativePath}`,
                targetPlatform: parsed.targetPlatform || 'Snowflake',
                variables: parsed.variables || [],
                components: parsed.components,
                links: parsed.links || []
              });
            } else if (parsed.objects && Array.isArray(parsed.objects)) {
              // Native Matillion export format with objects
              const comps = parsed.objects
                .filter((o: any) => o.type === 'component')
                .map((o: any, idx: number) => ({
                  id: o.id || `c-${idx}`,
                  name: o.name || `Component_${idx}`,
                  type: o.componentType || 'Calculator',
                  category: 'Transform' as const,
                  parameters: o.configuration || {},
                  x: 100 + (idx % 4) * 220,
                  y: 100 + Math.floor(idx / 4) * 160
                }));
              const links = parsed.objects
                .filter((o: any) => o.type === 'link')
                .map((o: any, idx: number) => ({
                  id: o.id || `l-${idx}`,
                  fromId: o.sourceComponentId,
                  toId: o.targetComponentId,
                  condition: o.condition || 'AUTO'
                }));

              foundJobs.push({
                id: `native-${Date.now()}-${foundJobs.length}`,
                name: parsed.name || relativePath.replace(/^.*[\\/]/, '').replace('.json', ''),
                jobType: parsed.jobType || 'Transformation',
                description: parsed.description || 'Imported Matillion project object',
                variables: [],
                components: comps,
                links: links
              });
            }
          } catch (itemErr) {
            console.warn(`Could not parse JSON file ${relativePath}`, itemErr);
          }
        }
      }

      if (foundJobs.length === 0) {
        throw new Error('No valid Matillion JSON job files found inside the uploaded ZIP archive.');
      }

      setUnzippedJobs(foundJobs);
    } catch (err: any) {
      setZipError(err.message || 'Failed to read ZIP archive.');
    } finally {
      setIsUnzipping(false);
    }
  };

  // Run Test Suite on all samples
  const handleRunTestSuite = () => {
    setIsRunningTests(true);
    setTestResults([]);

    setTimeout(() => {
      const results: TestResult[] = SAMPLE_JOBS.map(job => {
        const start = performance.now();
        const notebookRes = convertMatillionJob(job, { ...currentOptions, outputFormat: 'notebook' });
        const dltRes = convertMatillionJob(job, { ...currentOptions, outputFormat: 'dlt' });
        const end = performance.now();

        const notebookPassed = notebookRes.notebookCode.includes('import pyspark.sql.functions as F') &&
          notebookRes.notebookCode.length > 200;
        const dltPassed = dltRes.dltCode.includes('import dlt') &&
          dltRes.dltCode.includes('@dlt.');

        return {
          jobId: job.id,
          jobName: job.name,
          notebookPassed,
          dltPassed,
          componentsCount: job.components.length,
          durationMs: Math.round(end - start)
        };
      });

      setTestResults(results);
      setIsRunningTests(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FolderArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Test Center & Sample Assets</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  DLT & ZIP Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">Download sample Matillion JSON/ZIP files or import a ZIP folder of jobs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'downloads'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample JSON & ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('import-zip')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'import-zip'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Import ZIP Folder</span>
            {unzippedJobs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500 text-slate-950 font-bold">
                {unzippedJobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('test-suite')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'test-suite'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Automated Test Suite</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">

          {/* TAB 1: DOWNLOADS */}
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              
              {/* Highlight Card: Full ZIP bundle */}
              <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg shadow-cyan-950/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                    <Archive className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Full Matillion Jobs Sample Folder (ZIP)</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        5 JSON Jobs + Manifest
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Download a structured ZIP containing a folder of Matillion transformation & orchestration jobs.
                      You can directly re-upload this ZIP in the <strong>Import ZIP Folder</strong> tab to test multi-job ingestion!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadSampleZip}
                  disabled={downloadingZip}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 whitespace-nowrap transition-all"
                >
                  {downloadedZipSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>ZIP Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{downloadingZip ? 'Packing ZIP...' : 'Download Sample ZIP'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Individual Sample JSON Downloads */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                    Individual Sample JSON Files
                  </h4>
                  <span className="text-[11px] text-slate-500">Click to download standalone .json file</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SAMPLE_JOBS.map(sample => {
                    const isDownloaded = downloadedSingleId === sample.id;
                    return (
                      <div
                        key={sample.id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-cyan-300 transition-colors">
                              {sample.name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                sample.jobType === 'Transformation'
                                  ? 'bg-blue-950/40 text-blue-300 border-blue-500/30'
                                  : 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                              }`}>
                                {sample.jobType}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {sample.components.length} components
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onLoadJob(sample);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                            title="Load into workspace"
                          >
                            Load
                          </button>

                          <button
                            onClick={() => handleDownloadSingleJson(sample)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium border border-slate-700 transition-colors"
                            title="Download JSON file"
                          >
                            {isDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: IMPORT ZIP FOLDER */}
          {activeTab === 'import-zip' && (
            <div className="space-y-5">
              
              {/* Drag/Drop Box for ZIP */}
              <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <Archive className="w-10 h-10 text-slate-500 group-hover:text-cyan-400 transition-colors mb-3" />
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white">
                  Drop a Matillion ZIP folder here, or click to browse
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Supports .zip archives containing multiple Matillion job JSON files
                </span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipUpload}
                  className="hidden"
                />
              </label>

              {isUnzipping && (
                <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-center text-xs text-cyan-300 animate-pulse flex items-center justify-center gap-2">
                  <Archive className="w-4 h-4 animate-spin" />
                  <span>Unpacking ZIP archive and parsing Matillion JSON jobs...</span>
                </div>
              )}

              {zipError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{zipError}</span>
                </div>
              )}

              {/* Extracted Jobs Table */}
              {unzippedJobs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Discovered Jobs Inside Archive ({unzippedJobs.length})
                    </span>
                    <span className="text-xs text-slate-500">Select any job to load into the transpiler</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
                    {unzippedJobs.map((job, idx) => (
                      <div key={job.id || idx} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{job.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              job.jobType === 'Transformation'
                                ? 'bg-blue-950/40 text-blue-300 border-blue-500/30'
                                : 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                            }`}>
                              {job.jobType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{job.description}</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            {job.components.length} components &bull; {job.links.length} connections
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            onLoadJob(job);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 shrink-0 transition-all"
                        >
                          <span>Load & Transpile</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: AUTOMATED TEST SUITE */}
          {activeTab === 'test-suite' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-white">Automated Syntax & Lineage Test Suite</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Validates all preloaded sample jobs against both standard PySpark Notebook and Delta Live Tables (DLT) generators.
                  </p>
                </div>
                <button
                  onClick={handleRunTestSuite}
                  disabled={isRunningTests}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningTests ? 'Running Tests...' : 'Run All Tests'}</span>
                </button>
              </div>

              {testResults.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Job Test Case</th>
                        <th className="p-3">Components</th>
                        <th className="p-3">Standard Notebook</th>
                        <th className="p-3">Delta Live Tables (DLT)</th>
                        <th className="p-3 pr-4 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {testResults.map(res => (
                        <tr key={res.jobId} className="hover:bg-slate-900/40">
                          <td className="p-3 pl-4 font-medium text-slate-200">{res.jobName}</td>
                          <td className="p-3 text-slate-400">{res.componentsCount} nodes</td>
                          <td className="p-3">
                            {res.notebookPassed ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                              </span>
                            ) : (
                              <span className="text-rose-400">Failed</span>
                            )}
                          </td>
                          <td className="p-3">
                            {res.dltPassed ? (
                              <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Passed (@dlt)
                              </span>
                            ) : (
                              <span className="text-rose-400">Failed</span>
                            )}
                          </td>
                          <td className="p-3 pr-4 text-right text-slate-500">{res.durationMs}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Test suite covers Databricks Runtime 15.x and Delta Live Tables syntax</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
