import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ZoomIn, ZoomOut, RotateCcw, Download, Move, Maximize } from "lucide-react";
import { getSuccessors } from "../utils/cpmCalculations";

const PERTDiagram = ({ tasks, cmpResults, isCalculating }) => {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [groupedTasks, setGroupedTasks] = useState([]);

  // Positions optimisées pour le diagramme PERT
  const positions = {
    'DEB': { x: 80, y: 300 },
    'A': { x: 250, y: 150 },
    'B': { x: 250, y: 450 },
    'C': { x: 450, y: 80 },
    'D': { x: 450, y: 180 },
    'E': { x: 450, y: 280 },
    'F': { x: 450, y: 520 },
    'G': { x: 650, y: 130 },
    'H': { x: 850, y: 300 },
    'I': { x: 650, y: 80 },
    'J': { x: 650, y: 230 },
    'K': { x: 1050, y: 250 },
    'L': { x: 1050, y: 350 }
  };

  useEffect(() => {
    // Grouper les tâches ayant les mêmes successeurs
    const groupTasks = () => {
      const drawnGroups = new Set();
      const newGroupedTasks = [];

      Object.keys(tasks).forEach(task => {
        if ([...drawnGroups].flat().includes(task)) return;

        const taskSucc = getSuccessors(task, tasks).sort().join(',');
        const group = [task];

        for (const other of Object.keys(tasks)) {
          if (other === task || [...drawnGroups].flat().includes(other)) continue;
          if (getSuccessors(other, tasks).sort().join(',') === taskSucc) {
            group.push(other);
          }
        }

        newGroupedTasks.push(group);
        drawnGroups.add(group);
      });

      setGroupedTasks(newGroupedTasks);
    };

    groupTasks();
  }, [tasks]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, pan]);

  const createNode = (taskName, task, pos) => {
    const isCritical = cmpResults.margins && cmpResults.margins[taskName] === 0;
    const isSelected = selectedNode === taskName;
    
    // Pour les tâches groupées, trouver le groupe correspondant
    const taskGroup = groupedTasks.find(group => group.includes(taskName));
    const isGrouped = taskGroup && taskGroup.length > 1;
    
    // Si c'est une tâche groupée et pas la première du groupe, ne pas afficher
    if (isGrouped && taskName !== taskGroup[0]) return null;

    // Pour les tâches groupées, calculer le maxEF
    const maxEF = isGrouped 
      ? Math.max(...taskGroup.map(t => cmpResults.earliestFinish[t] || 0))
      : cmpResults.earliestFinish ? cmpResults.earliestFinish[taskName] || 0 : 0;

    // Contenu pour les successeurs (comme dans l'exemple)
    let rightContentItems = [];
    if (taskName !== 'DEB') {
      const successors = getSuccessors(isGrouped ? taskGroup[0] : taskName, tasks);
      const succValues = successors.map(s => ({ 
        name: s, 
        value: cmpResults.latestStart ? cmpResults.latestStart[s] || 0 : 0 
      }));
      const minValue = Math.min(...succValues.map(s => s.value));

      rightContentItems = succValues.map((s, index) => {
        const isMin = s.value === minValue;
        return (
          <div 
            key={s.name}
            className={`text-xs ${isMin ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'} ${
              index < succValues.length - 1 ? 'border-b border-gray-300 dark:border-gray-600' : ''
            } px-2 py-1`}
          >
            {s.value}
          </div>
        );
      });
    } else {
      // Pour le nœud DEB, afficher les LS des successeurs
      const successors = Object.keys(tasks).filter(t => tasks[t].predecessors.includes('DEB'));
      rightContentItems = successors.map(s => (
        <div 
          key={s}
          className="text-xs text-slate-600 dark:text-slate-400 px-2 py-1"
        >
          {cmpResults.latestStart ? cmpResults.latestStart[s] || 0 : 0}
        </div>
      ));
    }

    return (
      <div
        key={taskName}
        className={`node absolute cursor-pointer transition-all duration-300 ${
          isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
        }`}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: `translate(-50%, -50%)`,
        }}
        onClick={() => setSelectedNode(isSelected ? null : taskName)}
      >
        <div
          className={`w-24 h-16 rounded-full border-2 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 flex ${
            isCritical ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-blue-400 hover:border-blue-500'
          } ${isSelected ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}`}
        >
          {/* Left section - Early dates */}
          <div className="w-2/5 flex flex-col justify-center items-center border-r border-gray-300 dark:border-gray-600 p-1">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {maxEF}
            </div>
          </div>
          
          {/* Right section - Late dates and task info */}
          <div className="w-3/5 flex flex-col justify-center items-center p-1 overflow-y-auto">
            {taskName === 'DEB' ? (
              <div className="text-xs font-bold text-green-600 dark:text-green-400">DÉBUT</div>
            ) : (
              <>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isGrouped ? taskGroup.join(', ') : taskName}
                </div>
                <div className="flex flex-col items-center w-full">
                  {rightContentItems}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Task label below node */}
        {taskName !== 'DEB' && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {task?.name || (isGrouped ? taskGroup.map(t => t).join(', ') : taskName)}
            </div>
            <Badge variant="outline" className="text-xs mt-1 backdrop-blur-sm">
              {isGrouped 
                ? taskGroup.map(t => tasks[t]?.duration || 0).join(',') + 'j' 
                : (task?.duration || 0) + 'j'}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const createArrow = (from, to, taskName) => {
    const fromPos = positions[from];
    const toPos = positions[to];
    
    if (!fromPos || !toPos) return null;

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const length = Math.sqrt(dx * dx + dy * dy) - 96; // Account for node sizes
    const angle = Math.atan2(dy, dx);
    
    const startX = fromPos.x + 48 * Math.cos(angle);
    const startY = fromPos.y + 32 * Math.sin(angle);
    
    const isCritical = cmpResults.margins && cmpResults.margins[taskName] === 0;

    return (
      <g key={`arrow-${from}-${to}-${taskName}`}>
        {/* Arrow line */}
        <line
          x1={startX}
          y1={startY}
          x2={startX + length * Math.cos(angle)}
          y2={startY + length * Math.sin(angle)}
          stroke={isCritical ? "#ef4444" : "#64748b"}
          strokeWidth={isCritical ? "3" : "2"}
          className="transition-all duration-300"
        />
        
        {/* Arrow head */}
        <polygon
          points={`${startX + length * Math.cos(angle)},${startY + length * Math.sin(angle)} ${
            startX + (length - 8) * Math.cos(angle) - 4 * Math.sin(angle)
          },${startY + (length - 8) * Math.sin(angle) + 4 * Math.cos(angle)} ${
            startX + (length - 8) * Math.cos(angle) + 4 * Math.sin(angle)
          },${startY + (length - 8) * Math.sin(angle) - 4 * Math.cos(angle)}`}
          fill={isCritical ? "#ef4444" : "#64748b"}
          className="transition-all duration-300"
        />
        
        {/* Arrow label */}
        <text
          x={startX + (length * 0.5) * Math.cos(angle)}
          y={startY + (length * 0.5) * Math.sin(angle)}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-slate-700 dark:fill-slate-300 font-semibold"
          transform={`rotate(${angle * 180 / Math.PI}, ${startX + (length * 0.5) * Math.cos(angle)}, ${startY + (length * 0.5) * Math.sin(angle)})`}
        >
          <tspan
            x={startX + (length * 0.5) * Math.cos(angle)}
            y={startY + (length * 0.5) * Math.sin(angle) - 8}
          >
            {taskName}
          </tspan>
          <tspan
            x={startX + (length * 0.5) * Math.cos(angle)}
            y={startY + (length * 0.5) * Math.sin(angle) + 8}
            className="text-xs fill-slate-500"
          >
            ({tasks[taskName]?.duration || 0}j)
          </tspan>
        </text>
      </g>
    );
  };

  const exportDiagram = () => {
    // Mock export functionality
    console.log("Exporting diagram...");
  };

  return (
    <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-2xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Maximize className="h-6 w-6 mr-3 text-purple-500" />
            Diagramme PERT Interactif
            {isCalculating && (
              <Badge variant="secondary" className="ml-3 animate-pulse">
                Calcul en cours...
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 hover:bg-white/90"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 hover:bg-white/90"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 hover:bg-white/90"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportDiagram}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 hover:bg-white/90"
            >
              <Download className="h-4 w-4 mr-1" />
              PNG
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 p-3 rounded-lg border border-white/20">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              <span>Cliquez et glissez pour déplacer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-50"></div>
              <span>Tâches critiques</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-blue-400 bg-white"></div>
              <span>Tâches non-critiques</span>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 border border-white/20 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            height: '600px',
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* SVG for arrows */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {/* Create arrows for all task relationships */}
            {Object.entries(tasks).map(([taskName, task]) =>
              task.predecessors.map(pred => {
                if (pred === 'DEB') {
                  return createArrow('DEB', taskName, taskName);
                } else if (positions[pred]) {
                  return createArrow(pred, taskName, taskName);
                }
                return null;
              })
            ).flat().filter(Boolean)}
          </svg>

          {/* Start node */}
          {createNode('DEB', {}, positions['DEB'])}

          {/* Task nodes */}
          {Object.entries(tasks).map(([taskName, task]) => {
            const pos = positions[taskName];
            if (!pos) return null;
            return createNode(taskName, task, pos);
          })}

          {/* Loading overlay */}
          {isCalculating && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="text-lg font-semibold">Calcul du chemin critique...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zoom indicator */}
        <div className="mt-3 text-center">
          <Badge variant="outline" className="backdrop-blur-sm">
            Zoom: {Math.round(zoom * 100)}%
          </Badge>
        </div>

        {/* Selected node info */}
        {selectedNode && cmpResults.margins && (
          <div className="mt-4 p-4 rounded-lg backdrop-blur-sm bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/30">
            <h3 className="font-bold text-lg mb-2">Détails de la tâche {selectedNode}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold">Durée:</span> {tasks[selectedNode]?.duration}j
              </div>
              <div>
                <span className="font-semibold">Début au plus tôt:</span> {cmpResults.earliestStart[selectedNode]}
              </div>
              <div>
                <span className="font-semibold">Début au plus tard:</span> {cmpResults.latestStart[selectedNode]}
              </div>
              <div>
                <span className="font-semibold">Marge:</span> {cmpResults.margins[selectedNode]}j
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PERTDiagram;