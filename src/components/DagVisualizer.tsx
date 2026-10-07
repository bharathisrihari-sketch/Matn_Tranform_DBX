import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  Minimize2,
  ZoomIn, 
  ZoomOut,
  Search,
  X,
  Move,
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  FileImage,
  FolderOpen,
  Package,
  Gauge,
  ShieldCheck,
  Zap,
  FolderTree,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { MatillionJob, MatillionComponent } from '../types/matillion';

interface DagVisualizerProps {
  job: MatillionJob;
  selectedComponentId: string | null;
  onSelectComponent: (comp: MatillionComponent) => void;
  // Metrics & Toolbar Integrations for 1-Line Concise View
  complexityScore?: number;
  complexityLevel?: string;
  complexityBadgeBg?: string;
  onOpenComplexity?: () => void;
  onOpenSchema?: () => void;
  onOpenBatchOpt?: () => void;
  batchOptActive?: boolean;
  layoutMode?: 'split' | 'dag' | 'code';
  onLayoutModeChange?: (mode: 'split' | 'dag' | 'code') => void;
  showInspector?: boolean;
  onToggleInspector?: () => void;
  showFilesDrawer?: boolean;
  onToggleFilesDrawer?: () => void;
}

export const DagVisualizer: React.FC<DagVisualizerProps> = ({
  job,
  selectedComponentId,
  onSelectComponent,
  complexityScore = 78,
  complexityLevel = 'High',
  complexityBadgeBg = 'border-amber-500/30 bg-amber-950/40 text-amber-300',
  onOpenComplexity,
  onOpenSchema,
  onOpenBatchOpt,
  batchOptActive = true,
  layoutMode = 'split',
  onLayoutModeChange,
  showInspector = true,
  onToggleInspector,
  showFilesDrawer = false,
  onToggleFilesDrawer
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fullscreen view for drag to pan
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Expand / Collapse state for complex transformation node groups
  const [isTransformGroupCollapsed, setIsTransformGroupCollapsed] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportingStatus, setExportingStatus] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Esc to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Identify transformation sub-components that can be grouped
  const transformComponents = useMemo(() => {
    return job.components.filter(c => 
      c.category === 'Transform' || 
      c.category === 'Filter' || 
      c.category === 'Join' || 
      c.category === 'Aggregate' ||
      c.type === 'Calculator' ||
      c.type === 'Rank / Window'
    );
  }, [job]);

  const canGroupTransforms = transformComponents.length >= 2;

  // Compute node layout
  const rawNodes = useMemo(() => {
    const hasCoordinates = job.components.some(c => c.x !== undefined && c.y !== undefined);
    
    if (hasCoordinates) {
      const minX = Math.min(...job.components.map(c => c.x || 100));
      const minY = Math.min(...job.components.map(c => c.y || 100));
      return job.components.map(c => ({
        ...c,
        posX: (c.x || 100) - minX + 40,
        posY: (c.y || 100) - minY + 40,
        isGroup: false
      }));
    }

    // Auto layout based on links / depth levels
    const levels = new Map<string, number>();
    job.components.forEach(c => levels.set(c.id, 0));
    
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
        posY: pos.y,
        isGroup: false
      };
    });
  }, [job]);

  // Compute final nodes considering expand/collapse state
  const { nodes, links } = useMemo(() => {
    if (!isTransformGroupCollapsed || !canGroupTransforms) {
      return {
        nodes: rawNodes,
        links: job.links
      };
    }

    const transformIds = new Set(transformComponents.map(c => c.id));
    const nonGroupNodes = rawNodes.filter(n => !transformIds.has(n.id));
    const groupedRawNodes = rawNodes.filter(n => transformIds.has(n.id));

    const avgX = Math.round(groupedRawNodes.reduce((acc, n) => acc + n.posX, 0) / (groupedRawNodes.length || 1));
    const avgY = Math.round(groupedRawNodes.reduce((acc, n) => acc + n.posY, 0) / (groupedRawNodes.length || 1));

    const groupNode = {
      id: 'group-transformations',
      name: `Transformation & Enrichment Sub-Pipeline`,
      type: 'Grouped Transform',
      category: 'Transform' as const,
      parameters: {
        collapsedCount: transformComponents.length,
        components: transformComponents.map(c => c.name)
      },
      posX: avgX,
      posY: avgY,
      isGroup: true,
      subComponents: transformComponents
    };

    const finalNodes = [...nonGroupNodes, groupNode as any];

    const linkMap = new Map<string, any>();
    job.links.forEach(l => {
      let fromId = l.fromId;
      let toId = l.toId;

      if (transformIds.has(fromId)) fromId = 'group-transformations';
      if (transformIds.has(toId)) toId = 'group-transformations';

      if (fromId === 'group-transformations' && toId === 'group-transformations') {
        return;
      }

      const key = `${fromId}->${toId}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, {
          id: `link-${fromId}-${toId}`,
          fromId,
          toId,
          condition: l.condition
        });
      }
    });

    return {
      nodes: finalNodes,
      links: Array.from(linkMap.values())
    };
  }, [rawNodes, job.links, isTransformGroupCollapsed, canGroupTransforms, transformComponents]);

  const maxX = Math.max(...nodes.map(n => n.posX)) + 260;
  const maxY = Math.max(...nodes.map(n => n.posY)) + 160;

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // Search filtering logic
  const matchingNodeIds = useMemo(() => {
    return new Set(
      nodes.filter(node => {
        const matchesQuery = searchQuery === '' || 
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          JSON.stringify(node.parameters).toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = selectedTypeFilter === 'ALL' || 
          (selectedTypeFilter === 'READ' && (node.category === 'Read' || node.type.includes('Input') || node.type.includes('Load'))) ||
          (selectedTypeFilter === 'TRANSFORM' && (node.category === 'Transform' || node.type === 'Calculator' || node.type === 'Rank / Window' || node.type === 'Flatten')) ||
          (selectedTypeFilter === 'JOIN' && (node.category === 'Join' || node.type === 'Join')) ||
          (selectedTypeFilter === 'FILTER' && (node.category === 'Filter' || node.type === 'Filter')) ||
          (selectedTypeFilter === 'AGGREGATE' && (node.category === 'Aggregate' || node.type === 'Aggregate')) ||
          (selectedTypeFilter === 'WRITE' && (node.category === 'Write' || node.type.includes('Output')));

        return matchesQuery && matchesType;
      }).map(n => n.id)
    );
  }, [nodes, searchQuery, selectedTypeFilter]);

  const isFilterActive = searchQuery.trim() !== '' || selectedTypeFilter !== 'ALL';

  // Handle Zoom to Fit
  const handleZoomToFit = () => {
    if (!containerRef.current || nodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 50;

    const minX = Math.min(...nodes.map(n => n.posX));
    const boundingMaxX = Math.max(...nodes.map(n => n.posX + 200));
    const minY = Math.min(...nodes.map(n => n.posY));
    const boundingMaxY = Math.max(...nodes.map(n => n.posY + 90));

    const graphWidth = boundingMaxX - minX;
    const graphHeight = boundingMaxY - minY;

    const scaleX = (clientWidth - padding * 2) / Math.max(graphWidth, 100);
    const scaleY = (clientHeight - padding * 2) / Math.max(graphHeight, 100);
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.35);

    const centerX = (clientWidth - graphWidth * fitScale) / 2 - minX * fitScale;
    const centerY = (clientHeight - graphHeight * fitScale) / 2 - minY * fitScale;

    setZoom(Number(fitScale.toFixed(2)));
    setPan({ x: Math.round(centerX), y: Math.round(centerY) });
  };

  const handleCenterOnNode = (node: any) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const targetX = clientWidth / 2 - (node.posX + 95) * zoom;
    const targetY = clientHeight / 2 - (node.posY + 40) * zoom;
    setPan({ x: Math.round(targetX), y: Math.round(targetY) });
    if (!node.isGroup) {
      onSelectComponent(node);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleZoomToFit();
    }, 150);
    return () => clearTimeout(timer);
  }, [job.id, isTransformGroupCollapsed, isFullscreen]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dag-node') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setZoom(prev => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.3), 2.2));
    }
  };

  // Export DAG as SVG
  const handleExportSVG = () => {
    const width = Math.max(maxX + 60, 1200);
    const height = Math.max(maxY + 60, 700);

    let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #020617; font-family: ui-sans-serif, system-ui, sans-serif;">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
        </marker>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
        </filter>
      </defs>
      <text x="40" y="40" fill="#ffffff" font-size="18" font-weight="bold">${job.name}</text>
      <text x="40" y="60" fill="#94a3b8" font-size="12">Matillion ${job.jobType} Pipeline • Generated by MatConvDBX.ai.studio</text>
    `;

    links.forEach(link => {
      const fromNode = nodeMap.get(link.fromId);
      const toNode = nodeMap.get(link.toId);
      if (!fromNode || !toNode) return;

      const startX = fromNode.posX + (fromNode.isGroup ? 240 : 190);
      const startY = fromNode.posY + 32;
      const endX = toNode.posX;
      const endY = toNode.posY + 32;
      const curvature = Math.max(Math.abs(endX - startX) * 0.5, 40);

      svgStr += `
        <path d="M ${startX} ${startY} C ${startX + curvature} ${startY}, ${endX - curvature} ${endY}, ${endX} ${endY}"
              fill="none" stroke="#06b6d4" stroke-width="2" marker-end="url(#arrow)" opacity="0.85" />
      `;
    });

    nodes.forEach(node => {
      const isGroup = node.isGroup;
      const cardWidth = isGroup ? 240 : 190;
      const cardHeight = isGroup ? 80 : 64;
      const borderColor = isGroup ? '#f59e0b' : node.category === 'Read' ? '#10b981' : node.category === 'Write' ? '#f43f5e' : '#0ea5e9';
      const bgColor = isGroup ? '#1e1b4b' : '#0f172a';

      svgStr += `
        <g transform="translate(${node.posX}, ${node.posY})" filter="url(#shadow)">
          <rect width="${cardWidth}" height="${cardHeight}" rx="10" fill="${bgColor}" stroke="${borderColor}" stroke-width="1.5" />
          <text x="14" y="26" fill="#ffffff" font-size="12" font-weight="bold">${node.name.length > 24 ? node.name.slice(0, 22) + '...' : node.name}</text>
          <text x="14" y="44" fill="#94a3b8" font-size="10">${isGroup ? `📦 ${node.parameters?.collapsedCount} Grouped Transforms` : node.type}</text>
        </g>
      `;
    });

    svgStr += `</svg>`;

    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${job.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_dag.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    setExportingStatus('SVG Exported!');
    setTimeout(() => setExportingStatus(null), 2500);
  };

  // Export DAG as PNG
  const handleExportPNG = () => {
    setExportingStatus('Generating PNG...');
    const width = Math.max(maxX + 60, 1200);
    const height = Math.max(maxY + 60, 700);

    let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #020617; font-family: ui-sans-serif, system-ui, sans-serif;">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="#020617"/>
      <text x="40" y="40" fill="#ffffff" font-size="18" font-weight="bold">${job.name}</text>
      <text x="40" y="60" fill="#94a3b8" font-size="12">Matillion ${job.jobType} Pipeline • Generated by MatConvDBX.ai.studio</text>
    `;

    links.forEach(link => {
      const fromNode = nodeMap.get(link.fromId);
      const toNode = nodeMap.get(link.toId);
      if (!fromNode || !toNode) return;

      const startX = fromNode.posX + (fromNode.isGroup ? 240 : 190);
      const startY = fromNode.posY + 32;
      const endX = toNode.posX;
      const endY = toNode.posY + 32;
      const curvature = Math.max(Math.abs(endX - startX) * 0.5, 40);

      svgStr += `
        <path d="M ${startX} ${startY} C ${startX + curvature} ${startY}, ${endX - curvature} ${endY}, ${endX} ${endY}"
              fill="none" stroke="#06b6d4" stroke-width="2.5" marker-end="url(#arrow)" />
      `;
    });

    nodes.forEach(node => {
      const isGroup = node.isGroup;
      const cardWidth = isGroup ? 240 : 190;
      const cardHeight = isGroup ? 80 : 64;
      const borderColor = isGroup ? '#f59e0b' : node.category === 'Read' ? '#10b981' : node.category === 'Write' ? '#f43f5e' : '#0ea5e9';
      const bgColor = isGroup ? '#1e1b4b' : '#0f172a';

      svgStr += `
        <g transform="translate(${node.posX}, ${node.posY})">
          <rect width="${cardWidth}" height="${cardHeight}" rx="10" fill="${bgColor}" stroke="${borderColor}" stroke-width="2" />
          <text x="14" y="26" fill="#ffffff" font-size="12" font-weight="bold">${node.name.length > 24 ? node.name.slice(0, 22) + '...' : node.name}</text>
          <text x="14" y="46" fill="#94a3b8" font-size="10">${isGroup ? `📦 ${node.parameters?.collapsedCount} Grouped Transforms` : node.type}</text>
        </g>
      `;
    });

    svgStr += `</svg>`;

    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${job.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_dag.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportingStatus('PNG Exported!');
        setTimeout(() => setExportingStatus(null), 2500);
      }
    };
    img.src = url;
    setExportMenuOpen(false);
  };

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
    <div className={`${
      isFullscreen 
        ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none animate-fadeIn'
        : 'relative w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none'
    }`}>
      
      {/* 
        COMBINED 1-LINE AND CONCISE TOOLBAR 
        Unifies: Job Name/Type + Complexity + Schema + Batch Opt + Grouping + Search + Categories + Zoom + Export + Files + Layout + Fullscreen Toggle
      */}
      <div className="h-11 px-2.5 sm:px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-1.5 shrink-0 z-20 overflow-x-auto scrollbar-none whitespace-nowrap">
        
        {/* Left Section: Job Name + Badges (Complexity, Schema, Batch Opt, Group) */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Job Title & Type Pill */}
          <div className="flex items-center gap-1.5 pr-1 border-r border-slate-800">
            <span className="font-bold text-white text-xs truncate max-w-[130px] sm:max-w-[180px]" title={job.name}>
              {job.name}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
              job.jobType === 'Transformation'
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
            }`}>
              {job.jobType}
            </span>
          </div>

          {/* Complexity Score Badge */}
          <button
            onClick={onOpenComplexity}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all hover:scale-105 cursor-pointer border ${complexityBadgeBg}`}
            title="Conversion Complexity Score"
          >
            <Gauge className="w-3 h-3" />
            <span>Complexity: <strong className="font-mono">{complexityScore}/100</strong></span>
          </button>

          {/* Schema Preview Badge */}
          <button
            onClick={onOpenSchema}
            className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 transition-colors cursor-pointer"
            title="Schema Validation Preview"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Schema</span>
          </button>

          {/* Batch Optimizer Badge */}
          {batchOptActive && (
            <button
              onClick={onOpenBatchOpt}
              className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 transition-colors cursor-pointer"
              title="Batch Optimizer Auto-Partitioning"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Batch Opt</span>
            </button>
          )}

          {/* Expand / Collapse Transformation Group Toggle */}
          {canGroupTransforms && (
            <button
              onClick={() => setIsTransformGroupCollapsed(!isTransformGroupCollapsed)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                isTransformGroupCollapsed
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              title={isTransformGroupCollapsed ? 'Expand transformation sub-components' : 'Collapse transformation sub-components to simplify view'}
            >
              {isTransformGroupCollapsed ? (
                <>
                  <FolderOpen className="w-3 h-3 text-amber-400" />
                  <span>Expand ({transformComponents.length})</span>
                </>
              ) : (
                <>
                  <Package className="w-3 h-3 text-slate-400" />
                  <span>Collapse Group</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Middle Section: Search + Category Chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Compact Search Bar */}
          <div className="relative w-32 sm:w-40 lg:w-48">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-6 pr-5 py-0.5 text-[10px] sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="hidden xl:flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800">
            {['ALL', 'READ', 'TRANSFORM', 'JOIN', 'FILTER', 'WRITE'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedTypeFilter(cat)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
                  selectedTypeFilter === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Right Section: Zoom + Export + Files + Layout + FULLSCREEN TOGGLE */}
        <div className="flex items-center gap-1 shrink-0">
          
          {/* Zoom & Fit Control Pills */}
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 2.2))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => setZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.3))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>

            <button
              onClick={handleZoomToFit}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 text-[9px] font-semibold flex items-center gap-0.5 transition-colors text-cyan-400"
              title="Fit Entire Graph into View"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>Fit</span>
            </button>

            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 20, y: 20 });
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Reset (100%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <span className="text-[9px] font-mono text-slate-400 px-1 select-none">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Export DAG Menu */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-semibold flex items-center gap-1 transition-colors"
              title="Export DAG visualization as PNG or SVG"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 font-sans">
                <button
                  onClick={handleExportPNG}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileImage className="w-3.5 h-3.5 text-orange-400" />
                  <span>Export as PNG</span>
                </button>
                <button
                  onClick={handleExportSVG}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export as SVG</span>
                </button>
              </div>
            )}
          </div>

          {/* Files Drawer Toggle */}
          {onToggleFilesDrawer && !isFullscreen && (
            <button
              onClick={onToggleFilesDrawer}
              className={`px-2 py-0.5 rounded border text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                showFilesDrawer
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle Matillion Files Drawer"
            >
              <FolderTree className="w-3 h-3" />
              <span className="hidden sm:inline">Files</span>
            </button>
          )}

          {/* Layout Mode (Split / DAG / Code) */}
          {onLayoutModeChange && !isFullscreen && (
            <div className="flex items-center bg-slate-950 rounded p-0.5 border border-slate-800">
              <button
                onClick={() => onLayoutModeChange('split')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                  layoutMode === 'split' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => onLayoutModeChange('dag')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                  layoutMode === 'dag' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                DAG
              </button>
              <button
                onClick={() => onLayoutModeChange('code')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                  layoutMode === 'code' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Code
              </button>
            </div>
          )}

          {/* Inspector Panel Toggle */}
          {onToggleInspector && !isFullscreen && (
            <button
              onClick={onToggleInspector}
              className={`p-1 rounded text-slate-400 hover:text-white transition-colors ${
                showInspector ? 'bg-slate-800 text-white' : 'bg-slate-950'
              }`}
              title={showInspector ? 'Hide Inspector Panel' : 'Show Inspector Panel'}
            >
              {showInspector ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* 
            TOGGLE FULL SCREEN VIEW FOR DRAG TO PAN
          */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
              isFullscreen
                ? 'bg-orange-500 text-white border-orange-400 ring-2 ring-orange-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (or press Esc)' : 'Toggle Full Screen View for Drag to Pan'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>Fullscreen Pan</span>
              </>
            )}
          </button>

        </div>

      </div>

      {/* Canvas Area with Mouse Drag to Pan */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Floating Pan & Fullscreen Hint Badge */}
        <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg py-1 px-2.5 backdrop-blur-md shadow-md pointer-events-none">
          <Move className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] text-slate-400 font-medium font-mono">
            {isFullscreen ? (
              <span className="text-cyan-300 font-bold">FULLSCREEN MODE ACTIVE &bull; Drag to pan anywhere &bull; Press Esc to exit</span>
            ) : (
              <span>Drag canvas to pan &bull; Scroll to zoom {isTransformGroupCollapsed && <strong className="text-amber-400 ml-1">({transformComponents.length} transforms collapsed)</strong>}</span>
            )}
          </span>
        </div>

        {/* Scaled & Panned Canvas */}
        <div 
          ref={canvasRef}
          style={{ 
            width: `${Math.max(maxX, 1200)}px`, 
            height: `${Math.max(maxY, 700)}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
          className="relative min-w-full min-h-full"
        >
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
              </linearGradient>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
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

            {links.map(link => {
              const fromNode = nodeMap.get(link.fromId);
              const toNode = nodeMap.get(link.toId);
              if (!fromNode || !toNode) return null;

              const startX = fromNode.posX + (fromNode.isGroup ? 240 : 180);
              const startY = fromNode.posY + 32;
              const endX = toNode.posX;
              const endY = toNode.posY + 32;

              const dx = endX - startX;
              const curvature = Math.max(Math.abs(dx) * 0.5, 40);
              const path = `M ${startX} ${startY} C ${startX + curvature} ${startY}, ${endX - curvature} ${endY}, ${endX} ${endY}`;
              
              const isFailure = link.condition === 'FAILURE';
              const isConnectedToMatch = matchingNodeIds.has(fromNode.id) || matchingNodeIds.has(toNode.id);

              return (
                <g key={link.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke={isFailure ? '#ef4444' : isConnectedToMatch ? '#06b6d4' : '#475569'}
                    strokeWidth={isConnectedToMatch ? '2.5' : '1.5'}
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
            const isGroup = node.isGroup;
            const isSelected = selectedComponentId === node.id;
            const isMatching = matchingNodeIds.has(node.id);
            const isDimmed = isFilterActive && !isMatching;

            // GROUPED COMPOSITE NODE RENDERING
            if (isGroup) {
              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTransformGroupCollapsed(false);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${node.posX}px`,
                    top: `${node.posY}px`,
                    width: '240px'
                  }}
                  className="dag-node rounded-xl p-3 shadow-2xl transition-all cursor-pointer bg-gradient-to-br from-amber-950/40 to-slate-900 border-2 border-amber-500/60 ring-2 ring-amber-500/20 hover:scale-105"
                  title="Transformation Sub-Pipeline Group. Click to expand."
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                        <Package className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="font-bold text-xs text-white">Transform Stage</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {node.parameters?.collapsedCount} Nodes
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-1 mb-2 font-mono">
                    {node.parameters?.components?.join(' → ')}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-amber-500/30 text-[10px]">
                    <span className="text-amber-300 font-medium">Click to Expand Sub-Nodes</span>
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
              );
            }

            // STANDARD COMPONENT NODE RENDERING
            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectComponent(node);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleCenterOnNode(node);
                }}
                style={{
                  position: 'absolute',
                  left: `${node.posX}px`,
                  top: `${node.posY}px`,
                  width: '190px'
                }}
                className={`dag-node rounded-xl p-3 shadow-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-slate-900/95 ring-2 ring-cyan-500/40 shadow-cyan-500/20 scale-105 z-20'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900 z-10'
                } ${
                  isMatching && isFilterActive
                    ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-emerald-500/20'
                    : ''
                } ${
                  isDimmed ? 'opacity-30 grayscale-[40%]' : 'opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="p-1 rounded bg-slate-950 border border-slate-800 shrink-0">
                      {getComponentIcon(node.type)}
                    </div>
                    <span className="text-xs font-semibold text-white truncate" title={node.name}>
                      {node.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded border font-mono truncate max-w-[120px] ${getComponentBadgeColor(node.type)}`}>
                    {node.type}
                  </span>
                  
                  {isSelected && (
                    <span className="text-[9px] font-bold text-cyan-400 flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
