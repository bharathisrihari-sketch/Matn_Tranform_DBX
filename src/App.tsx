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
  CheckSquare,
  EyeOff,
  ChevronLeft,
  ChevronRight
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
import { GeminiChatModal } from './components/GeminiChatModal';

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
  // DBX Code View hidden by default, DAG maximized by default as requested
  const [layoutMode, setLayoutMode] = useState<'split' | 'dag' | 'code'>('dag');

  // Modal States
  const [isTestCenterOpen, setIsTestCenterOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  // Gemini Tranformx Chatbot toggle state (show / hide)
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState(false);

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
        isGeminiChatOpen={isGeminiChatOpen}
        onToggleGeminiChat={() => setIsGeminiChatOpen(!isGeminiChatOpen)}
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
              {/* Main Workspace Area */}
              <div className="flex-1 flex overflow-hidden relative">
                
                {/* Optional Matillion Folder Drawer in Studio */}
                {showFolderDrawer && (
                  <aside className="w-72 lg:w-80 shrink-0 h-full overflow-hidden border-r border-slate-800 z-20 transition-all duration-300 ease-in-out">
                    <MatillionFolderView
                      currentJob={currentJob}
                      onSelectJob={handleSelectSample}
                      onOpenUpload={() => setIsUploadOpen(true)}
                      onClose={() => setShowFolderDrawer(false)}
                    />
                  </aside>
                )}

                {/* Left Inspector Panel (Matillion Details, Complexity, Schema Preview & UC Settings) */}
                {showInspector && (
                  <aside className="w-80 lg:w-96 shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out">
                    <MatillionInspector
                      selectedComponent={selectedComponent}
                      job={currentJob}
                      options={options}
                      onOptionsChange={setOptions}
                      activeTab={inspectorTab}
                      onActiveTabChange={setInspectorTab}
                      onClose={() => setShowInspector(false)}
                    />
                  </aside>
                )}

                {/* Collapsible Slide Window Divider: 1-click collapse when open */}
                {showInspector && (
                  <button
                    onClick={() => setShowInspector(false)}
                    className="w-3 hover:w-3.5 h-full bg-slate-900 hover:bg-slate-800 border-r border-slate-800 flex items-center justify-center text-slate-500 hover:text-cyan-300 transition-all z-20 cursor-pointer shrink-0 group shadow-sm"
                    title="Collapse / Hide Menu before DAG"
                  >
                    <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Collapsible Slide Window Rail: 1-click expand when menu is hidden */}
                {!showInspector && (
                  <button
                    onClick={() => setShowInspector(true)}
                    className="h-full w-7 bg-slate-900 hover:bg-slate-800 border-r border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-cyan-300 transition-all z-20 group cursor-pointer shadow-lg shrink-0"
                    title="Show Inspector & Insights Menu (Opens before DAG view)"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-800 group-hover:bg-cyan-500/20 border border-slate-700 group-hover:border-cyan-500/40 flex items-center justify-center transition-colors">
                      <ChevronRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="[writing-mode:vertical-lr] text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-300 rotate-180">
                      Inspector Menu
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  </button>
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
                        onToggleHideCode={() => setLayoutMode('dag')}
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

      {/* GEMINI TRANFORMX CHATBOT (Toggle Feature to Show & Hide) */}
      <GeminiChatModal
        isOpen={isGeminiChatOpen}
        onClose={() => setIsGeminiChatOpen(false)}
        job={currentJob}
        options={options}
        complexity={{
          score: complexity.score,
          rating: complexity.level,
          summary: complexity.summary
        }}
      />

      {/* Floating Toggle Button for Gemini Tranformx (Show / Hide toggle) */}
      <aside aria-label="Gemini Tranformx Assistant Launcher" className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsGeminiChatOpen(!isGeminiChatOpen)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full font-bold text-xs shadow-2xl transition-all duration-200 cursor-pointer border ${
            isGeminiChatOpen
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 shadow-slate-950/80 hover:text-white'
              : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border-cyan-400/40 shadow-cyan-500/25 hover:scale-105'
          }`}
          title={isGeminiChatOpen ? 'Hide Gemini Tranformx Chatbot' : 'Open Gemini Tranformx AI Copilot'}
        >
          {isGeminiChatOpen ? (
            <>
              <EyeOff className="w-4 h-4 text-cyan-400" />
              <span>Hide Gemini Tranformx</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200 animate-spin-slow" />
              <span>Gemini Tranformx</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </>
          )}
        </button>
      </aside>

    </div>
  );
}
