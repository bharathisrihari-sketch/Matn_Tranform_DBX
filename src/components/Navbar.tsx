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
  UploadCloud,
  FolderArchive,
  Layers,
  Globe,
  Mail,
  Users,
  Menu,
  Search,
  FolderTree,
  ChevronDown
} from 'lucide-react';
import { MatillionJob, ConversionOptions } from '../types/matillion';
import { SAMPLE_JOBS } from '../data/samples';
import { AppView } from './GcpConsoleSidebar';

interface NavbarProps {
  currentJob: MatillionJob;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onSelectSample: (job: MatillionJob) => void;
  onOpenUpload: () => void;
  onOpenTestCenter: () => void;
  onOpenCheatSheet: () => void;
  onOpenReport: () => void;
  onOpenExport: () => void;
  onToggleSidebar?: () => void;
  options: ConversionOptions;
  onOptionsChange: (newOptions: ConversionOptions) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentJob,
  activeView,
  onViewChange,
  onSelectSample,
  onOpenUpload,
  onOpenTestCenter,
  onOpenCheatSheet,
  onOpenReport,
  onOpenExport,
  onToggleSidebar,
  options,
  onOptionsChange
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Left: GCP Hamburger Menu & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Sideways Navigation (GCP Console Style)"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div 
            onClick={() => onViewChange('studio')}
            className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Workflow className="w-4 h-4 text-white" />
          </div>

          <div className="flex items-center gap-2">
            <span 
              onClick={() => onViewChange('studio')}
              className="font-bold text-white tracking-tight text-base cursor-pointer hover:text-orange-400 transition-colors"
            >
              MatConvDBX.ai.studio
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 hidden sm:inline-block">
              Databricks
            </span>
          </div>
        </div>

        {/* Center: GCP Console Style Project / Job Selector & Search */}
        <div className="flex-1 max-w-xl mx-2 hidden md:flex items-center gap-2">
          {/* Active Job Selector Pill */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs w-full max-w-sm">
            <span className="text-slate-500 font-mono text-[11px]">Job:</span>
            <select
              value={currentJob.id}
              onChange={(e) => {
                const found = SAMPLE_JOBS.find(j => j.id === e.target.value);
                if (found) {
                  onSelectSample(found);
                  onViewChange('studio');
                }
              }}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer truncate flex-1"
            >
              {SAMPLE_JOBS.map(sample => (
                <option key={sample.id} value={sample.id} className="bg-slate-900 text-slate-200">
                  {sample.name} ({sample.jobType})
                </option>
              ))}
            </select>
          </div>

          {/* Quick DLT / Mode indicator */}
          {options.outputFormat === 'dlt' ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              DLT Mode
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
              DBR {options.runtimeVersion}
            </span>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onViewChange('docs')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              activeView === 'docs'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/20 ring-1 ring-blue-400/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-blue-500/40 hover:bg-slate-700'
            }`}
            title="Open Documentation & Architecture Guides (First / Primary)"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Docs</span>
            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-mono hidden md:inline">1st</span>
          </button>

          <button
            onClick={() => onViewChange('folder')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
              activeView === 'folder'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
            title="Browse Matillion folder tree for uploaded files & search"
          >
            <FolderTree className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Folder View</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Upload your own Matillion JSON or ZIP folder export"
          >
            <UploadCloud className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Import ZIP</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Code</span>
          </button>
        </div>

      </div>
    </header>
  );
};
