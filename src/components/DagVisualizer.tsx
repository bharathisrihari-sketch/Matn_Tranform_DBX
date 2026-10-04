import React, { useMemo } from 'react';
import { 
  Database, 
  Calculator, 
  Filter, 
  GitMerge, 
  Layers, 
  TrendingUp, 
  Save, 
  FileSearch, 
  Terminal, 
  PlayCircle, 
  Bell, 
  RotateCcw,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { MatillionJob, MatillionComponent } from '../types/matillion';

interface DagVisualizerProps {
  job: MatillionJob;
  selectedComponentId: string | null;
  onSelectComponent: (comp: MatillionComponent) => void;
}

export const DagVisualizer: React.FC<DagVisualizerProps> = ({
  job,
  selectedComponentId,
  onSelectComponent
}) => {
  const [zoom, setZoom] = React.useState(1);

  // Compute node bounding box & layout if x,y are present or fallback to linear/tiered
  const nodes = useMemo(() => {
    // If coords are provided, compute scaled coordinates
    const hasCoordinates = job.components.some(c => c.x !== undefined && c.y !== undefined);
    
    if (hasCoordinates) {
      const minX = Math.min(...job.components.map(c => c.x || 100));
      const minY = Math.min(...job.components.map(c => c.y || 100));
      return job.components.map(c => ({
        ...c,
        posX: (c.x || 100) - minX + 40,
        posY: (c.y || 100) - minY + 40
      }));
    }

    // Auto layout based on links / columns
    const levels = new Map<string, number>();
    job.components.forEach(c => levels.set(c.id, 0));
    
    // Pass 1: compute depth
    job.links.forEach(l => {
      const current = levels.get(l.toId) || 0;
      const parentLvl = levels.get(l.fromId) || 0;
      levels.set(l.toId, Math.max(current, parentLvl + 1));
    });

    const levelGroups = new Map<number, string[]>();
    levels.forEach((lvl, id) => {
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(id);
    });

    const nodePositions = new Map<string, { x: number; y: number }>();
    levelGroups.forEach((ids, lvl) => {
      ids.forEach((id, idx) => {
        nodePositions.set(id, {
          x: 40 + lvl * 240,
          y: 40 + idx * 120
        });
      });
    });

    return job.components.map(c => {
      const pos = nodePositions.get(c.id) || { x: 50, y: 50 };
      return {
        ...c,
        posX: pos.x,
        posY: pos.y
      };
    });
  }, [job]);

  const maxX = Math.max(...nodes.map(n => n.posX)) + 260;
  const maxY = Math.max(...nodes.map(n => n.posY)) + 160;

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'Table Input': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'Calculator': return <Calculator className="w-4 h-4 text-sky-400" />;
      case 'Filter': return <Filter className="w-4 h-4 text-amber-400" />;
      case 'Join': return <GitMerge className="w-4 h-4 text-purple-400" />;
      case 'Aggregate': return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'Rank / Window': return <TrendingUp className="w-4 h-4 text-indigo-400" />;
      case 'Table Output': return <Save className="w-4 h-4 text-rose-400" />;
      case 'File Exists': return <FileSearch className="w-4 h-4 text-emerald-400" />;
      case 'SQL Script': return <Terminal className="w-4 h-4 text-slate-300" />;
      case 'Run Transformation': return <PlayCircle className="w-4 h-4 text-orange-400" />;
      case 'Webhook Notification': return <Bell className="w-4 h-4 text-pink-400" />;
      default: return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  const getComponentBadgeColor = (type: string) => {
    switch (type) {
      case 'Table Input': return 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300';
      case 'Calculator': return 'border-sky-500/30 bg-sky-950/40 text-sky-300';
      case 'Filter': return 'border-amber-500/30 bg-amber-950/40 text-amber-300';
      case 'Join': return 'border-purple-500/30 bg-purple-950/40 text-purple-300';
      case 'Aggregate': return 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300';
      case 'Rank / Window': return 'border-indigo-500/30 bg-indigo-950/40 text-indigo-300';
      case 'Table Output': return 'border-rose-500/30 bg-rose-950/40 text-rose-300';
      case 'Run Transformation': return 'border-orange-500/30 bg-orange-950/40 text-orange-300';
      default: return 'border-slate-700 bg-slate-800/80 text-slate-300';
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Controls Bar */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1 backdrop-blur-md shadow-md">
        <span className="text-xs font-semibold px-2 text-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          Pipeline Lineage DAG ({nodes.length} Nodes)
        </span>
        <div className="h-4 w-px bg-slate-800"></div>
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.8))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8 relative">
        <div 
          style={{ 
            width: `${Math.max(maxX, 900)}px`, 
            height: `${Math.max(maxY, 400)}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.15s ease-out'
          }}
          className="relative min-w-full min-h-full"
        >
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
              </linearGradient>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
              </marker>
              <marker
                id="arrowhead-fail"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
              </marker>
            </defs>

            {job.links.map(link => {
              const fromNode = nodeMap.get(link.fromId);
              const toNode = nodeMap.get(link.toId);
              if (!fromNode || !toNode) return null;

              const startX = fromNode.posX + 180;
              const startY = fromNode.posY + 32;
              const endX = toNode.posX;
              const endY = toNode.posY + 32;

              const dx = endX - startX;
              const curvature = Math.max(Math.abs(dx) * 0.5, 40);
              const path = `M ${startX} ${startY} C ${startX + curvature} ${startY}, ${endX - curvature} ${endY}, ${endX} ${endY}`;
              
              const isFailure = link.condition === 'FAILURE';

              return (
                <g key={link.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke={isFailure ? '#ef4444' : '#64748b'}
                    strokeWidth="2"
                    strokeDasharray={isFailure ? '4 4' : 'none'}
                    markerEnd={isFailure ? 'url(#arrowhead-fail)' : 'url(#arrowhead)'}
                    className="transition-all duration-300"
                  />
                  {link.condition && link.condition !== 'AUTO' && link.condition !== 'UNCONDITIONAL' && (
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 - 8}
                      fill={isFailure ? '#f87171' : '#38bdf8'}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="bg-slate-900 px-1"
                    >
                      {link.condition}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node Cards */}
          {nodes.map(node => {
            const isSelected = selectedComponentId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => onSelectComponent(node)}
                style={{
                  position: 'absolute',
                  left: `${node.posX}px`,
                  top: `${node.posY}px`,
                  width: '190px'
                }}
                className={`z-10 rounded-xl p-3 border transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md ${
                  isSelected 
                    ? 'border-orange-500 bg-slate-900 ring-2 ring-orange-500/50 shadow-orange-500/20 translate-y-[-2px]' 
                    : 'border-slate-800 bg-slate-900/95 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getComponentIcon(node.type)}
                    <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[130px]" title={node.name}>
                      {node.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-2 py-0.5 rounded-md font-medium border ${getComponentBadgeColor(node.type)}`}>
                    {node.type}
                  </span>
                  <span className="text-slate-500 font-mono text-[9px]">
                    PySpark &check;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="h-9 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Click any node to inspect parameters & PySpark code.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Input</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Transform</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Join</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Output / Merge</span>
        </div>
      </div>
    </div>
  );
};
