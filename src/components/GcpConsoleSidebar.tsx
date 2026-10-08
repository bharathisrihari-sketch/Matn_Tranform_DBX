import React from 'react';
import { 
  BookOpen, 
  Workflow, 
  FolderTree, 
  FolderArchive, 
  Download, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Layers,
  Database,
  Terminal,
  ShieldCheck,
  Search,
  ExternalLink,
  CheckSquare
} from 'lucide-react';

export type AppView = 'docs' | 'studio' | 'hub' | 'folder' | 'test' | 'download' | 'about';

interface GcpConsoleSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  uploadedFilesCount?: number;
}

export const GcpConsoleSidebar: React.FC<GcpConsoleSidebarProps> = ({
  activeView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  uploadedFilesCount = 8
}) => {
  // Navigation tabs order: Docs FIRST, Studio SECOND as requested!
  const navItems: {
    id: AppView;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    accentColor: string;
  }[] = [
    {
      id: 'docs',
      title: 'Documentation',
      subtitle: 'Architecture & Guides',
      icon: BookOpen,
      badge: '★ 1st',
      accentColor: 'text-blue-400 bg-blue-500/25 border-blue-400/50 shadow-sm shadow-blue-500/20'
    },
    {
      id: 'studio',
      title: 'Converter Studio',
      subtitle: 'Visual DAG & PySpark',
      icon: Workflow,
      badge: 'Core',
      accentColor: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
    },
    {
      id: 'hub',
      title: 'Migration Hub',
      subtitle: 'Inventory & Core 7',
      icon: CheckSquare,
      badge: '7 Feat',
      accentColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    },
    {
      id: 'folder',
      title: 'Matillion Files',
      subtitle: 'ZIP Folder Explorer',
      icon: FolderTree,
      badge: `${uploadedFilesCount}`,
      accentColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    },
    {
      id: 'test',
      title: 'Test Bench',
      subtitle: 'Samples & Downloads',
      icon: FolderArchive,
      badge: 'ZIP/JSON',
      accentColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
    },
    {
      id: 'download',
      title: 'Download Code',
      subtitle: 'PySpark & DAB Bundles',
      icon: Download,
      badge: 'DAB',
      accentColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
    },
    {
      id: 'about',
      title: 'Contacts & Info',
      subtitle: 'Team & Support',
      icon: Users,
      accentColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30'
    }
  ];

  return (
    <aside
      className={`h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-60 lg:w-64'
      }`}
    >
      {/* Sidebar Header Category */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Migration Menu
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand sideways navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Sideways Navigation List */}
      <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full text-left rounded-xl transition-all flex items-center gap-3 relative group ${
                isCollapsed ? 'p-3 justify-center' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium'
              }`}
              title={isCollapsed ? `${item.title}: ${item.subtitle}` : undefined}
            >
              {/* GCP Console Active Left Indicator Stripe */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-orange-400 to-amber-500 rounded-r"></div>
              )}

              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? item.accentColor
                    : 'bg-slate-950 text-slate-400 group-hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <div>
                    <div className="text-xs truncate flex items-center gap-1.5">
                      <span>{item.title}</span>
                      {index === 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                          1st
                        </span>
                      )}
                      {index === 1 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                          2nd
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                        isActive
                          ? item.accentColor
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Panel */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Runtime Engine:</span>
            <span className="font-mono text-cyan-300 font-bold">Spark 3.5 LTS</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Governance:</span>
            <span className="font-mono text-emerald-400 font-bold">Unity Catalog</span>
          </div>
        </div>
      )}
    </aside>
  );
};
