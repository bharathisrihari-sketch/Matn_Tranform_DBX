import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode2, 
  Search, 
  Workflow, 
  UploadCloud, 
  Download, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  Sparkles,
  CheckCircle2,
  FileJson,
  X,
  Plus
} from 'lucide-react';
import { MatillionJob, MatillionProjectFile } from '../types/matillion';
import { SAMPLE_JOBS } from '../data/samples';

// Default multi-file project structure
export const DEFAULT_PROJECT_FILES: MatillionProjectFile[] = [
  {
    id: SAMPLE_JOBS[0].id,
    name: SAMPLE_JOBS[0].name,
    path: `transformations/customer360/${SAMPLE_JOBS[0].name}.json`,
    folder: 'transformations/customer360',
    jobType: SAMPLE_JOBS[0].jobType,
    sizeBytes: 18450,
    componentCount: SAMPLE_JOBS[0].components.length,
    jobData: SAMPLE_JOBS[0]
  },
  {
    id: SAMPLE_JOBS[1].id,
    name: SAMPLE_JOBS[1].name,
    path: `transformations/finance/${SAMPLE_JOBS[1].name}.json`,
    folder: 'transformations/finance',
    jobType: SAMPLE_JOBS[1].jobType,
    sizeBytes: 24120,
    componentCount: SAMPLE_JOBS[1].components.length,
    jobData: SAMPLE_JOBS[1]
  },
  {
    id: SAMPLE_JOBS[2].id,
    name: SAMPLE_JOBS[2].name,
    path: `analytics/clickstream/${SAMPLE_JOBS[2].name}.json`,
    folder: 'analytics/clickstream',
    jobType: SAMPLE_JOBS[2].jobType,
    sizeBytes: 15300,
    componentCount: SAMPLE_JOBS[2].components.length,
    jobData: SAMPLE_JOBS[2]
  },
  {
    id: SAMPLE_JOBS[3].id,
    name: SAMPLE_JOBS[3].name,
    path: `orchestrations/nightly/${SAMPLE_JOBS[3].name}.json`,
    folder: 'orchestrations/nightly',
    jobType: SAMPLE_JOBS[3].jobType,
    sizeBytes: 31200,
    componentCount: SAMPLE_JOBS[3].components.length,
    jobData: SAMPLE_JOBS[3]
  },
  {
    id: 'sample-cust-ltv',
    name: 'Transform_Customer_LTV_Aggregator',
    path: 'transformations/customer360/Transform_Customer_LTV_Aggregator.json',
    folder: 'transformations/customer360',
    jobType: 'Transformation',
    sizeBytes: 12400,
    componentCount: 6,
    jobData: {
      ...SAMPLE_JOBS[0],
      id: 'sample-cust-ltv',
      name: 'Transform_Customer_LTV_Aggregator',
      description: 'Calculates 365-day moving customer Lifetime Value (LTV) and churn probabilities.'
    }
  },
  {
    id: 'sample-inv-forecast',
    name: 'Transform_Inventory_Supply_Forecast',
    path: 'transformations/inventory/Transform_Inventory_Supply_Forecast.json',
    folder: 'transformations/inventory',
    jobType: 'Transformation',
    sizeBytes: 16900,
    componentCount: 8,
    jobData: {
      ...SAMPLE_JOBS[1],
      id: 'sample-inv-forecast',
      name: 'Transform_Inventory_Supply_Forecast',
      description: 'Predictive warehouse inventory restock levels with safety stock reorder triggers.'
    }
  },
  {
    id: 'sample-hourly-cdc',
    name: 'Orchestrate_Hourly_Orders_CDC',
    path: 'orchestrations/hourly/Orchestrate_Hourly_Orders_CDC.json',
    folder: 'orchestrations/hourly',
    jobType: 'Orchestration',
    sizeBytes: 28400,
    componentCount: 11,
    jobData: {
      ...SAMPLE_JOBS[3],
      id: 'sample-hourly-cdc',
      name: 'Orchestrate_Hourly_Orders_CDC',
      description: 'Micro-batch CDC change data capture from OLTP database with automated failover alerting.'
    }
  },
  {
    id: 'sample-raw-ingest',
    name: 'Transform_Snowflake_S3_Direct_Load',
    path: 'staging/raw_ingestion/Transform_Snowflake_S3_Direct_Load.json',
    folder: 'staging/raw_ingestion',
    jobType: 'Transformation',
    sizeBytes: 9800,
    componentCount: 5,
    jobData: {
      ...SAMPLE_JOBS[2],
      id: 'sample-raw-ingest',
      name: 'Transform_Snowflake_S3_Direct_Load',
      description: 'Direct ingestion from AWS S3 parquet partitions into raw landing table.'
    }
  }
];

interface MatillionFolderViewProps {
  currentJob: MatillionJob;
  onSelectJob: (job: MatillionJob) => void;
  onOpenUpload: () => void;
  customFiles?: MatillionProjectFile[];
  onClose?: () => void;
}

export const MatillionFolderView: React.FC<MatillionFolderViewProps> = ({
  currentJob,
  onSelectJob,
  onOpenUpload,
  customFiles,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Transformation' | 'Orchestration'>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'transformations': true,
    'transformations/customer360': true,
    'transformations/finance': true,
    'transformations/inventory': true,
    'orchestrations': true,
    'orchestrations/nightly': true,
    'orchestrations/hourly': true,
    'analytics': true,
    'analytics/clickstream': true,
    'staging': true,
    'staging/raw_ingestion': true
  });

  const files = customFiles && customFiles.length > 0 ? customFiles : DEFAULT_PROJECT_FILES;

  // Filter files by search query and job type
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.path.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || f.jobType === filterType;
      return matchesSearch && matchesType;
    });
  }, [files, searchQuery, filterType]);

  // Group files by directory
  const folderTree = useMemo(() => {
    const folders: Record<string, MatillionProjectFile[]> = {};
    filteredFiles.forEach(file => {
      const dir = file.folder || 'root';
      if (!folders[dir]) folders[dir] = [];
      folders[dir].push(file);
    });
    return folders;
  }, [filteredFiles]);

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    Object.keys(folderTree).forEach(k => { all[k] = true; });
    setExpandedFolders(all);
  };

  const collapseAll = () => {
    setExpandedFolders({});
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200">
      
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Matillion Project Files</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {files.length} files
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Hide Matillion Files Drawer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Option */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Matillion files & folders..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Chips & Expand/Collapse */}
        <div className="flex items-center justify-between text-[11px] gap-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                filterType === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({files.length})
            </button>
            <button
              onClick={() => setFilterType('Transformation')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                filterType === 'Transformation' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Transform
            </button>
            <button
              onClick={() => setFilterType('Orchestration')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                filterType === 'Orchestration' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Orchestrate
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <button onClick={expandAll} className="hover:text-white px-1">Expand</button>
            <span>/</span>
            <button onClick={collapseAll} className="hover:text-white px-1">Collapse</button>
          </div>
        </div>
      </div>

      {/* Folder Tree Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
        {Object.keys(folderTree).length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 font-sans">
            <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No Matillion files match "{searchQuery}"</p>
          </div>
        ) : (
          Object.entries(folderTree).map(([folderPath, folderFiles]) => {
            const isExpanded = expandedFolders[folderPath] !== false;
            return (
              <div key={folderPath} className="space-y-0.5">
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(folderPath)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-slate-800/80 text-left transition-colors text-slate-300 font-semibold group"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate flex-1 font-sans text-xs">{folderPath}/</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-sans">
                    {folderFiles.length}
                  </span>
                </button>

                {/* Files in Folder */}
                {isExpanded && (
                  <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-3.5">
                    {folderFiles.map(file => {
                      const isSelected = currentJob.id === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => onSelectJob(file.jobData)}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-orange-500/20 text-white border border-orange-500/40 shadow-sm'
                              : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.jobType === 'Transformation' ? (
                              <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-400' : 'text-blue-400'}`} />
                            ) : (
                              <Workflow className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-400' : 'text-purple-400'}`} />
                            )}
                            <span className="truncate text-xs font-sans font-medium" title={file.name}>
                              {file.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-sans">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                              file.jobType === 'Transformation'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-purple-500/10 text-purple-400'
                            }`}>
                              {file.componentCount} comps
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-3 h-3 text-orange-400 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Actions: Upload ZIP & Refresh */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex flex-col gap-2 font-sans">
        <button
          onClick={onOpenUpload}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload ZIP Archive / JSON</span>
        </button>
        <p className="text-[10px] text-slate-500 text-center">
          Extracts folder hierarchies and bulk converts all Matillion jobs into PySpark
        </p>
      </div>

    </div>
  );
};
