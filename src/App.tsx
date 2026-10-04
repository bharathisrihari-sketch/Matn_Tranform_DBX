/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Layers, 
  Code2, 
  Workflow, 
  Database, 
  CheckCircle2, 
  Sliders, 
  Maximize2, 
  Columns3, 
  PanelLeftClose, 
  PanelLeft,
  Flame,
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { SAMPLE_JOBS } from './data/samples';
import { MatillionJob, MatillionComponent, ConversionOptions } from './types/matillion';
import { convertMatillionJob } from './services/converter';
import { Navbar } from './components/Navbar';
import { DagVisualizer } from './components/DagVisualizer';
import { CodeViewer } from './components/CodeViewer';
import { MatillionInspector } from './components/MatillionInspector';
import { CheatSheetModal } from './components/CheatSheetModal';
import { MigrationReportModal } from './components/MigrationReportModal';
import { ExportModal } from './components/ExportModal';
import { UploadModal } from './components/UploadModal';

export default function App() {
  const [currentJob, setCurrentJob] = useState<MatillionJob>(SAMPLE_JOBS[0]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    SAMPLE_JOBS[0].components[0]?.id || null
  );

  const [options, setOptions] = useState<ConversionOptions>({
    outputFormat: 'notebook',
    useUnityCatalog: true,
    catalogName: 'gold_analytics',
    schemaName: 'customer_intelligence',
    deltaWriteMode: 'merge',
    useLiquidClustering: true,
    clusterByColumns: ['country', 'loyalty_tier'],
    zOrderColumns: ['customer_id', 'order_date'],
    variableStrategy: 'widgets',
    includeSparkInit: true,
    includeTypeHints: true,
    includeDataQualityChecks: true,
    runtimeVersion: '15.4'
  });

  const [showInspector, setShowInspector] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'split' | 'dag' | 'code'>('split');

  // Modal States
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Converted PySpark Output
  const convertedOutput = useMemo(() => {
    return convertMatillionJob(currentJob, options);
  }, [currentJob, options]);

  const selectedComponent = useMemo(() => {
    return currentJob.components.find(c => c.id === selectedComponentId) || null;
  }, [currentJob, selectedComponentId]);

  const handleSelectSample = (job: MatillionJob) => {
    setCurrentJob(job);
    setSelectedComponentId(job.components[0]?.id || null);
  };

  const handleSelectComponent = (comp: MatillionComponent) => {
    setSelectedComponentId(comp.id);
    if (!showInspector) setShowInspector(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Top Navigation */}
      <Navbar
        currentJob={currentJob}
        onSelectSample={handleSelectSample}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        options={options}
        onOptionsChange={setOptions}
      />

      {/* Subheader Context & Metrics Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{currentJob.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              currentJob.jobType === 'Transformation'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
            }`}>
              {currentJob.jobType}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-3">
            <span>{currentJob.description}</span>
          </div>
        </div>

        {/* Quick Action Badges & View Controls */}
        <div className="flex items-center gap-3">
          
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {currentJob.components.length} Components
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
              Delta Lake ACID
            </span>
            <span className="px-2 py-0.5 rounded bg-orange-950/40 text-orange-300 border border-orange-500/30">
              DBR {options.runtimeVersion}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setShowInspector(!showInspector)}
              className={`p-1.5 rounded transition-colors ${
                showInspector ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={showInspector ? 'Hide Inspector Panel' : 'Show Inspector Panel'}
            >
              {showInspector ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
            </button>
            <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                layoutMode === 'split' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Split DAG & Code View"
            >
              Split View
            </button>
            <button
              onClick={() => setLayoutMode('dag')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                layoutMode === 'dag' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Maximize DAG Canvas"
            >
              DAG
            </button>
            <button
              onClick={() => setLayoutMode('code')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                layoutMode === 'code' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Maximize Code Editor"
            >
              Code
            </button>
          </div>

        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Inspector Panel (Matillion Details, Parameters & UC Settings) */}
        {showInspector && (
          <aside className="w-80 lg:w-96 shrink-0 h-full overflow-hidden transition-all duration-200">
            <MatillionInspector
              selectedComponent={selectedComponent}
              job={currentJob}
              options={options}
              onOptionsChange={setOptions}
            />
          </aside>
        )}

        {/* Center / Right Split View */}
        <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* DAG Pipeline Graph Visualizer */}
          {(layoutMode === 'split' || layoutMode === 'dag') && (
            <section className={`${
              layoutMode === 'dag' ? 'w-full' : 'w-full md:w-1/2'
            } h-full overflow-hidden relative`}>
              <DagVisualizer
                job={currentJob}
                selectedComponentId={selectedComponentId}
                onSelectComponent={handleSelectComponent}
              />
            </section>
          )}

          {/* Generated Databricks PySpark Code Viewer */}
          {(layoutMode === 'split' || layoutMode === 'code') && (
            <section className={`${
              layoutMode === 'code' ? 'w-full' : 'w-full md:w-1/2'
            } h-full overflow-hidden`}>
              <CodeViewer
                output={convertedOutput}
                jobName={currentJob.name}
                selectedComponent={selectedComponent}
              />
            </section>
          )}

        </main>

      </div>

      {/* Modals */}
      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />

      <MigrationReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        job={currentJob}
        output={convertedOutput}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        job={currentJob}
        output={convertedOutput}
        options={options}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportJob={(job) => {
          setCurrentJob(job);
          setSelectedComponentId(job.components[0]?.id || null);
        }}
      />

    </div>
  );
}
