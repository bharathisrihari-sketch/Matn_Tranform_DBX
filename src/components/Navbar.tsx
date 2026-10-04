import React from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Download, 
  Sliders, 
  FileCode2, 
  Workflow, 
  CheckCircle2, 
  RotateCcw,
  UploadCloud
} from 'lucide-react';
import { MatillionJob, ConversionOptions } from '../types/matillion';
import { SAMPLE_JOBS } from '../data/samples';

interface NavbarProps {
  currentJob: MatillionJob;
  onSelectSample: (job: MatillionJob) => void;
  onOpenUpload: () => void;
  onOpenCheatSheet: () => void;
  onOpenReport: () => void;
  onOpenExport: () => void;
  options: ConversionOptions;
  onOptionsChange: (newOptions: ConversionOptions) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentJob,
  onSelectSample,
  onOpenUpload,
  onOpenCheatSheet,
  onOpenReport,
  onOpenExport,
  options,
  onOptionsChange
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-lg">Matillion &rarr; PySpark</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                Databricks Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Automated ETL Transpiler & Asset Bundle Generator</p>
          </div>
        </div>

        {/* Sample Selector dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg p-1">
            <span className="text-xs text-slate-400 pl-2 font-medium">Samples:</span>
            <select
              value={currentJob.id}
              onChange={(e) => {
                const found = SAMPLE_JOBS.find(j => j.id === e.target.value);
                if (found) onSelectSample(found);
              }}
              className="bg-transparent text-xs text-slate-200 font-medium py-1 px-2.5 rounded focus:outline-none focus:bg-slate-700 cursor-pointer"
            >
              {SAMPLE_JOBS.map(sample => (
                <option key={sample.id} value={sample.id} className="bg-slate-900 text-slate-200">
                  {sample.name} ({sample.jobType})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
            title="Upload your own Matillion JSON export"
          >
            <UploadCloud className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden md:inline">Import JSON</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCheatSheet}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Matillion SQL vs PySpark Function Mapping"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Function Cheat Sheet</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Migration Readiness Audit"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Audit Report</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Bundle</span>
          </button>
        </div>

      </div>
    </header>
  );
};
