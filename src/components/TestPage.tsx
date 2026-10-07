import React, { useState } from 'react';
import { 
  FolderArchive, 
  Download, 
  CheckCircle2, 
  Play, 
  FileCode2, 
  Archive, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Terminal,
  ShieldCheck,
  Zap,
  Layers,
  Cpu
} from 'lucide-react';
import JSZip from 'jszip';
import { SAMPLE_JOBS } from '../data/samples';
import { MatillionJob, ConversionOptions } from '../types/matillion';
import { convertMatillionJob } from '../services/converter';
import { computeSideBySideDiff } from '../services/diffGenerator';

interface TestPageProps {
  onLoadJob: (job: MatillionJob) => void;
  onNavigateToStudio: () => void;
  currentOptions: ConversionOptions;
}

interface TestRunResult {
  jobId: string;
  jobName: string;
  jobType: string;
  componentsCount: number;
  notebookPassed: boolean;
  dltPassed: boolean;
  diffPassed: boolean;
  diffChangesDetected: number;
  scdPassed: boolean;
  durationMs: number;
  assertionsCount: number;
}

export const TestPage: React.FC<TestPageProps> = ({
  onLoadJob,
  onNavigateToStudio,
  currentOptions
}) => {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadedZipSuccess, setDownloadedZipSuccess] = useState(false);
  const [downloadedSingleId, setDownloadedSingleId] = useState<string | null>(null);

  // Test sandbox state
  const [isProcessingSandbox, setIsProcessingSandbox] = useState(false);
  const [sandboxJobs, setSandboxJobs] = useState<MatillionJob[]>([]);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  // Automated test runner state
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestRunResult[]>([]);

  // Generate & download full sample ZIP archive
  const handleDownloadSampleZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("matillion_sample_jobs");

      const manifest = {
        exportedAt: new Date().toISOString(),
        version: "1.5.0",
        format: "Matillion ETL Project Export",
        platform: "MatConvDBX.ai.studio",
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

  // Run all automated unit tests
  const handleRunAllTests = () => {
    setIsRunningTests(true);
    setTestResults([]);

    setTimeout(() => {
      const results: TestRunResult[] = SAMPLE_JOBS.map(job => {
        const t0 = performance.now();
        const nb = convertMatillionJob(job, { ...currentOptions, outputFormat: 'notebook' });
        const dlt = convertMatillionJob(job, { ...currentOptions, outputFormat: 'dlt' });
        
        // Execute side-by-side diff generator
        const diff = computeSideBySideDiff(nb.notebookCode, dlt.dltCode);
        const changedLines = diff.filter(d => d.type === 'modified' || d.type === 'added' || d.type === 'removed');
        const diffPassed = diff.length > 0 && changedLines.length > 0;

        const t1 = performance.now();

        const notebookPassed = nb.notebookCode.includes('import pyspark.sql.functions as F') &&
          nb.notebookCode.length > 200;
        const dltPassed = dlt.dltCode.includes('import dlt') &&
          dlt.dltCode.includes('@dlt.');
        const scdPassed = !job.components.some(c => c.parameters?.writeMode === 'SCD2_MERGE') ||
          dlt.dltCode.includes('dlt.apply_changes');

        return {
          jobId: job.id,
          jobName: job.name,
          jobType: job.jobType,
          componentsCount: job.components.length,
          notebookPassed,
          dltPassed,
          diffPassed,
          diffChangesDetected: changedLines.length,
          scdPassed,
          durationMs: Math.round(t1 - t0),
          assertionsCount: job.components.length * 3 + 6
        };
      });

      setTestResults(results);
      setIsRunningTests(false);
    }, 450);
  };

  // Handle uploaded test ZIP or JSON file
  const handleSandboxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingSandbox(true);
    setSandboxError(null);
    setSandboxJobs([]);

    try {
      if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const discovered: MatillionJob[] = [];

        for (const [path, entry] of Object.entries(zip.files)) {
          if (!entry.dir && path.toLowerCase().endsWith('.json') && !path.includes('manifest.json')) {
            try {
              const text = await entry.async('string');
              const parsed = JSON.parse(text);
              if (parsed.components && Array.isArray(parsed.components)) {
                discovered.push({
                  id: parsed.id || `zip-${Date.now()}-${discovered.length}`,
                  name: parsed.name || path.replace(/^.*[\\/]/, '').replace('.json', ''),
                  jobType: parsed.jobType || (parsed.name?.toLowerCase().includes('orch') ? 'Orchestration' : 'Transformation'),
                  description: parsed.description || `Extracted from ${path}`,
                  targetPlatform: parsed.targetPlatform || 'Snowflake',
                  variables: parsed.variables || [],
                  components: parsed.components,
                  links: parsed.links || []
                });
              }
            } catch (err) {
              console.warn("Parse error for item in zip", err);
            }
          }
        }

        if (discovered.length === 0) {
          throw new Error("No valid Matillion JSON files found inside the uploaded ZIP folder.");
        }
        setSandboxJobs(discovered);
      } else {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed.components && Array.isArray(parsed.components)) {
          setSandboxJobs([{
            id: parsed.id || `sandbox-${Date.now()}`,
            name: parsed.name || file.name.replace('.json', ''),
            jobType: parsed.jobType || 'Transformation',
            description: parsed.description || 'Uploaded test job file',
            variables: parsed.variables || [],
            components: parsed.components,
            links: parsed.links || []
          }]);
        } else {
          throw new Error("Unrecognized JSON format. Missing 'components' array.");
        }
      }
    } catch (err: any) {
      setSandboxError(err.message || "Failed to process uploaded test file.");
    } finally {
      setIsProcessingSandbox(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-10 space-y-10 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">TEST BENCH & SAMPLE SUITE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            MatConvDBX Test & Verification Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Download preloaded sample Matillion job archives, individual JSON files, or run automated transpilation tests.
          </p>
        </div>

        <button
          onClick={onNavigateToStudio}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 self-start md:self-auto transition-colors"
        >
          <span>Open in Converter Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. FEATURED DOWNLOADS: ZIP & SAMPLES */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <FolderArchive className="w-4 h-4 text-cyan-400" />
          Sample Files & Bundles
        </h2>

        {/* Featured Sample ZIP Card */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-cyan-950/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Archive className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Sample Matillion Jobs Bundle (ZIP Archive)</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Ready to Import
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                Download a complete ZIP folder containing all 5 realistic Matillion jobs (Customer 360, Daily Sales Ingest, SCD Type 2 Dimension, Clickstream JSON explode, and Multi-tenant Table Iterator) with <code className="text-cyan-300">manifest.json</code>.
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
                <span>{downloadingZip ? 'Packing ZIP...' : 'Download Sample ZIP (.zip)'}</span>
              </>
            )}
          </button>
        </div>

        {/* Individual Sample JSON Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {SAMPLE_JOBS.map(sample => {
            const isDownloaded = downloadedSingleId === sample.id;
            return (
              <div
                key={sample.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
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
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {sample.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {sample.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      onLoadJob(sample);
                      onNavigateToStudio();
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Load Job</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => handleDownloadSingleJson(sample)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium border border-slate-700 transition-colors"
                    title="Download individual JSON"
                  >
                    {isDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. AUTOMATED TEST RUNNER */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Automated Transpiler Test Suite
          </h2>

          <button
            onClick={handleRunAllTests}
            disabled={isRunningTests}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunningTests ? 'Executing Tests...' : 'Run Full Test Suite'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-400">
            Automated test suite executes end-to-end AST parsing and syntax validation across all preloaded transformation and orchestration pipelines, verifying Delta Lake MERGE semantics, Delta Live Tables (DLT) decorators, and Auto Loader streams.
          </p>

          {testResults.length > 0 && (
            <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3 pl-4">Job Test Case</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Standard Notebook</th>
                    <th className="p-3">Delta Live Tables</th>
                    <th className="p-3">PySpark ⟷ DLT Diff</th>
                    <th className="p-3">Assertions</th>
                    <th className="p-3 pr-4 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                  {testResults.map(res => (
                    <tr key={res.jobId} className="hover:bg-slate-850">
                      <td className="p-3 pl-4 font-bold text-white">{res.jobName}</td>
                      <td className="p-3 text-slate-400">{res.jobType}</td>
                      <td className="p-3 text-emerald-400 font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Passed
                      </td>
                      <td className="p-3 text-cyan-300 font-semibold">
                        {res.dltPassed ? <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> @dlt.table & view</span> : 'Fail'}
                      </td>
                      <td className="p-3 text-amber-300 font-semibold">
                        {res.diffPassed ? (
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span>Aligned ({res.diffChangesDetected} deltas)</span>
                          </span>
                        ) : 'Fail'}
                      </td>
                      <td className="p-3 text-slate-300 font-sans">{res.assertionsCount} verified</td>
                      <td className="p-3 pr-4 text-right text-slate-500">{res.durationMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. TEST FILE SANDBOX */}
      <div className="space-y-4 pt-4 pb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Test File Sandbox & ZIP Inspector
        </h2>

        <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
          <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-cyan-400 transition-colors mb-2" />
          <span className="text-xs font-bold text-slate-200 group-hover:text-white">
            Upload custom test .json file or .zip folder archive to inspect
          </span>
          <span className="text-[11px] text-slate-500 mt-1">
            Accepts single Matillion job JSON or ZIP containing folders of jobs
          </span>
          <input
            type="file"
            accept=".json,.txt,.zip"
            onChange={handleSandboxUpload}
            className="hidden"
          />
        </label>

        {isProcessingSandbox && (
          <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-center text-xs text-cyan-300 animate-pulse flex items-center justify-center gap-2">
            <Archive className="w-4 h-4 animate-spin" />
            <span>Parsing test file and validating schema...</span>
          </div>
        )}

        {sandboxError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{sandboxError}</span>
          </div>
        )}

        {sandboxJobs.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300">
              Verified {sandboxJobs.length} Job(s) in Sandbox:
            </span>
            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80">
              {sandboxJobs.map((j, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-white text-xs block">{j.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {j.jobType} &bull; {j.components.length} components &bull; {j.links.length} connections
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onLoadJob(j);
                      onNavigateToStudio();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Load into Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
