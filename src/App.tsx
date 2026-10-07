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
  ShieldCheck,
  Gauge,
  Zap,
  FolderTree,
  CheckSquare
} from 'lucide-react';
import { SAMPLE_JOBS } from './data/samples';
import { MatillionJob, MatillionComponent, ConversionOptions } from './types/matillion';
import { convertMatillionJob } from './services/converter';
import { calculateConversionComplexity } from './services/complexity';
import { Navbar } from './components/Navbar';
import { GcpConsoleSidebar, AppView } from './components/GcpConsoleSidebar';
import { DagVisualizer } from './components/DagVisualizer';
import { CodeViewer } from './components/CodeViewer';
import { MatillionInspector } from './components/MatillionInspector';
import { MatillionFolderView } from './components/MatillionFolderView';
import { MigrationHubPage } from './components/MigrationHubPage';
import { CheatSheetModal } from './components/CheatSheetModal';
import { MigrationReportModal } from './components/MigrationReportModal';
import { ExportModal } from './components/ExportModal';
import { UploadModal } from './components/UploadModal';
import { TestCenterModal } from './components/TestCenterModal';
import { DocumentationPage } from './components/DocumentationPage';
import { TestPage } from './components/TestPage';
import { DownloadCodePage } from './components/DownloadCodePage';
import { AboutContactsPage } from './components/AboutContactsPage';

export default function App() {
  const [currentJob, setCurrentJob] = useState<MatillionJob>(SAMPLE_JOBS[0]);
  
  // Navigation: Docs as first tab, Studio as second tab
  const [activeView, setActiveView] = useState<AppView>('docs');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFolderDrawer, setShowFolderDrawer] = useState(false);

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
    runtimeVersion: '15.4',
    dltExpectationsMode: 'drop',
    dltPipelineType: 'triggered',
    dltUseStreaming: true,
    // Batch Optimizer enabled by default with medium data volume
    batchOptimizer: true,
    inputDataVolume: 'medium'
  });

  const [showInspector, setShowInspector] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<'component' | 'complexity' | 'schema' | 'options' | 'variables'>('component');
  const [layoutMode, setLayoutMode] = useState<'split' | 'dag' | 'code'>('split');

  // Modal States
  const [isTestCenterOpen, setIsTestCenterOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Conversion Complexity Score
  const complexity = useMemo(() => {
    return calculateConversionComplexity(currentJob);
  }, [currentJob]);

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
    setInspectorTab('component');
  };

  const handleSelectComponent = (comp: MatillionComponent) => {
    setSelectedComponentId(comp.id);
    setInspectorTab('component');
    if (!showInspector) setShowInspector(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Top Navigation Bar (GCP Console App Bar) */}
      <Navbar
        currentJob={currentJob}
        activeView={activeView}
        onViewChange={setActiveView}
        onSelectSample={handleSelectSample}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenTestCenter={() => setIsTestCenterOpen(true)}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        options={options}
        onOptionsChange={setOptions}
      />

      {/* Main Body: GCP Console Sideways Sidebar + Active View Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sideways Navigation Sidebar (Docs 1st, Studio 2nd, Hub, Folder, Testing, Download, About) */}
        <GcpConsoleSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* View Workspace Container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* VIEW 1: DOCUMENTATION PORTAL (FIRST TAB) */}
          {activeView === 'docs' && (
            <DocumentationPage
              onNavigateToStudio={() => setActiveView('studio')}
            />
          )}

          {/* VIEW 2: CONVERTER STUDIO (SECOND TAB) */}
          {activeView === 'studio' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Standalone concise bar only if layoutMode is strictly 'code' */}
              {layoutMode === 'code' && (
                <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate max-w-[200px]">{currentJob.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {currentJob.jobType}
                    </span>
                    <button
                      onClick={() => {
                        setShowInspector(true);
                        setInspectorTab('complexity');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${complexity.badgeBg}`}
                    >
                      Complexity: {complexity.score}/100
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center bg-slate-950 rounded p-0.5 border border-slate-800">
                      <button onClick={() => setLayoutMode('split')} className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white">Split</button>
                      <button onClick={() => setLayoutMode('dag')} className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white">DAG</button>
                      <button onClick={() => setLayoutMode('code')} className="px-2 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400 font-bold">Code</button>
                    </div>
                    <button
                      onClick={() => setShowInspector(!showInspector)}
                      className={`p-1 rounded text-slate-400 hover:text-white ${showInspector ? 'bg-slate-800 text-white' : ''}`}
                    >
                      {showInspector ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Main Workspace Area */}
              <div className="flex-1 flex overflow-hidden relative">
                
                {/* Optional Matillion Folder Drawer in Studio */}
                {showFolderDrawer && (
                  <aside className="w-72 lg:w-80 shrink-0 h-full overflow-hidden border-r border-slate-800 z-20">
                    <MatillionFolderView
                      currentJob={currentJob}
                      onSelectJob={handleSelectSample}
                      onOpenUpload={() => setIsUploadOpen(true)}
                    />
                  </aside>
                )}

                {/* Left Inspector Panel (Matillion Details, Complexity, Schema Preview & UC Settings) */}
                {showInspector && (
                  <aside className="w-80 lg:w-96 shrink-0 h-full overflow-hidden transition-all duration-200">
                    <MatillionInspector
                      selectedComponent={selectedComponent}
                      job={currentJob}
                      options={options}
                      onOptionsChange={setOptions}
                      activeTab={inspectorTab}
                      onActiveTabChange={setInspectorTab}
                    />
                  </aside>
                )}

                {/* Center / Right Split View */}
                <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                  
                  {/* DAG Pipeline Graph Visualizer (Houses the UNIFIED 1-LINE TOOLBAR and FULLSCREEN PAN) */}
                  {(layoutMode === 'split' || layoutMode === 'dag') && (
                    <section className={`${
                      layoutMode === 'dag' ? 'w-full' : 'w-full md:w-1/2'
                    } h-full overflow-hidden relative`}>
                      <DagVisualizer
                        job={currentJob}
                        selectedComponentId={selectedComponentId}
                        onSelectComponent={handleSelectComponent}
                        complexityScore={complexity.score}
                        complexityLevel={complexity.level}
                        complexityBadgeBg={complexity.badgeBg}
                        onOpenComplexity={() => {
                          setShowInspector(true);
                          setInspectorTab('complexity');
                        }}
                        onOpenSchema={() => {
                          setShowInspector(true);
                          setInspectorTab('schema');
                        }}
                        onOpenBatchOpt={() => {
                          setShowInspector(true);
                          setInspectorTab('options');
                        }}
                        batchOptActive={options.batchOptimizer}
                        layoutMode={layoutMode}
                        onLayoutModeChange={setLayoutMode}
                        showInspector={showInspector}
                        onToggleInspector={() => setShowInspector(!showInspector)}
                        showFilesDrawer={showFolderDrawer}
                        onToggleFilesDrawer={() => setShowFolderDrawer(!showFolderDrawer)}
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
                        targetOutputFormat={options.outputFormat}
                      />
                    </section>
                  )}

                </main>

              </div>
            </div>
          )}

          {/* VIEW 3: MIGRATION & CORE INVENTORY HUB (ALL 7 CORE FEATURES) */}
          {activeView === 'hub' && (
            <MigrationHubPage
              currentJob={currentJob}
              onSelectJob={handleSelectSample}
              onNavigateToStudio={() => setActiveView('studio')}
              options={options}
            />
          )}

          {/* VIEW 4: MATILLION PROJECT FOLDER VIEW (ZIP FOLDER EXPLORER WITH SEARCH) */}
          {activeView === 'folder' && (
            <div className="flex-1 h-full overflow-hidden">
              <MatillionFolderView
                currentJob={currentJob}
                onSelectJob={(job) => {
                  handleSelectSample(job);
                  setActiveView('studio');
                }}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            </div>
          )}

          {/* VIEW 5: TEST BENCH & SAMPLES PAGE */}
          {activeView === 'test' && (
            <TestPage
              onLoadJob={(job) => {
                handleSelectSample(job);
                setActiveView('studio');
              }}
              onNavigateToStudio={() => setActiveView('studio')}
              currentOptions={options}
            />
          )}

          {/* VIEW 6: DOWNLOAD PRODUCTION CODE HUB */}
          {activeView === 'download' && (
            <DownloadCodePage
              job={currentJob}
              output={convertedOutput}
              options={options}
              onNavigateToStudio={() => setActiveView('studio')}
              onNavigateToTesting={() => setActiveView('test')}
            />
          )}

          {/* VIEW 7: ABOUT & CONTACTS PORTAL */}
          {activeView === 'about' && (
            <AboutContactsPage
              onNavigateToStudio={() => setActiveView('studio')}
              onNavigateToDownload={() => setActiveView('download')}
            />
          )}

        </div>
      </div>

      {/* Global Modals */}
      <TestCenterModal
        isOpen={isTestCenterOpen}
        onClose={() => setIsTestCenterOpen(false)}
        onLoadJob={handleSelectSample}
        currentOptions={options}
      />

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
          setActiveView('studio');
        }}
      />

    </div>
  );
}
