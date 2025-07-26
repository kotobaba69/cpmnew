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

  // Positions optimisées pour le diagramme CPM style classique
  const positions = {
    'DEB': { x: 100, y: 300 },
    'A': { x: 300, y: 200 },
    'B': { x: 300, y: 400 },
    'C': { x: 500, y: 120 },
    'D': { x: 500, y: 220 },
    'E': { x: 500, y: 320 },
    'F': { x: 500, y: 480 },
    'G': { x: 700, y: 170 },
    'H': { x: 900, y: 300 },
    'I': { x: 700, y: 270 },
    'J': { x: 700, y: 370 },
    'K': { x: 1100, y: 250 },
    'L': { x: 1100, y: 350 },
    'FIN': { x: 1300, y: 300 }
  };

  // Calculer le chemin critique pour l'affichage
  const criticalTasks = cmpResults.criticalPath || [];
  
  // Fonction pour vérifier si une arête fait partie du chemin critique
  const isCriticalEdge = (from, to) => {
    return criticalTasks.includes(from) && criticalTasks.includes(to);
  };

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
    
    // Valeurs pour l'affichage (style diagramme CPM classique)
    const earliestStart = cmpResults.earliestStart ? cmpResults.earliestStart[taskName] || 0 : 0;
    const latestStart = cmpResults.latestStart ? cmpResults.latestStart[taskName] || 0 : 0;
    
    // Gestion des nœuds spéciaux
    if (taskName === 'DEB') {
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
          <div className="w-20 h-20 rounded-full border-4 border-gray-800 bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center">
            <div className="text-sm font-bold text-gray-800 text-center">
              0
            </div>
          </div>
        </div>
      );
    }
    
    // Nœud FIN (si pas de successeurs)
    const successors = getSuccessors(taskName, tasks);
    if (taskName === 'FIN' || (successors.length === 0 && taskName !== 'DEB')) {
      return (
        <div
          key="FIN"
          className={`node absolute cursor-pointer transition-all duration-300 ${
            isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
          }`}
          style={{
            left: `${positions.FIN?.x || pos.x}px`,
            top: `${positions.FIN?.y || pos.y}px`,
            transform: `translate(-50%, -50%)`,
          }}
          onClick={() => setSelectedNode(isSelected ? null : 'FIN')}
        >
          <div className="w-20 h-20 rounded-full border-4 border-gray-800 bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center">
            <div className="text-sm font-bold text-gray-800 text-center">
              {cmpResults.totalDuration || 0}
            </div>
          </div>
        </div>
      );
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
        {/* Nœud circulaire style CPM classique */}
        <div
          className={`w-24 h-24 rounded-full border-4 bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex ${
            isCritical ? 'border-red-600' : 'border-gray-800'
          } ${isSelected ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}`}
        >
          {/* Partie gauche - ES (rouge) */}
          <div className="w-1/2 h-full flex items-center justify-center border-r-2 border-gray-800 rounded-l-full">
            <div className="text-lg font-bold text-red-600">
              {earliestStart}
            </div>
          </div>
          
          {/* Partie droite - LS (bleu) */}
          <div className="w-1/2 h-full flex items-center justify-center rounded-r-full">
            <div className="text-lg font-bold text-blue-600">
              {latestStart}
            </div>
          </div>
        </div>
        
        {/* Étiquette de la tâche sous le nœud */}
        <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-xs text-gray-600 max-w-20 break-words">
            {task?.name}
          </div>
        </div>
      </div>
    );
  };

  const createArrow = (from, to, taskName) => {
    const fromPos = positions[from];
    const toPos = positions[to];
    
    if (!fromPos || !toPos) return null;

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const length = Math.sqrt(dx * dx + dy * dy) - 80; // Account for node sizes (20px radius * 2 + margin)
    const angle = Math.atan2(dy, dx);
    
    const startX = fromPos.x + 48 * Math.cos(angle); // 48px = radius du nœud (24px * 2)
    const startY = fromPos.y + 48 * Math.sin(angle);
    
    const isCritical = cmpResults.margins && cmpResults.margins[taskName] === 0;
    const isFromCritical = cmpResults.margins && cmpResults.margins[from] === 0;
    const isCriticalPath = isCritical && isFromCritical;

    return (
      <g key={`arrow-${from}-${to}-${taskName}`}>
        {/* Arrow line */}
        <line
          x1={startX}
          y1={startY}
          x2={startX + length * Math.cos(angle)}
          y2={startY + length * Math.sin(angle)}
          stroke={isCriticalPath ? "#dc2626" : "#374151"}
          strokeWidth={isCriticalPath ? "4" : "2"}
          className="transition-all duration-300"
        />
        
        {/* Arrow head */}
        <polygon
          points={`${startX + length * Math.cos(angle)},${startY + length * Math.sin(angle)} ${
            startX + (length - 10) * Math.cos(angle) - 5 * Math.sin(angle)
          },${startY + (length - 10) * Math.sin(angle) + 5 * Math.cos(angle)} ${
            startX + (length - 10) * Math.cos(angle) + 5 * Math.sin(angle)
          },${startY + (length - 10) * Math.sin(angle) - 5 * Math.cos(angle)}`}
          fill={isCriticalPath ? "#dc2626" : "#374151"}
          className="transition-all duration-300"
        />
        
        {/* Task letter above the arrow */}
        <text
          x={startX + (length * 0.4) * Math.cos(angle)}
          y={startY + (length * 0.4) * Math.sin(angle) - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-lg font-bold ${
            isCriticalPath ? 'fill-red-600' : 'fill-gray-800'
          }`}
        >
          {taskName.toLowerCase()}
        </text>
        
        {/* Duration below the arrow */}
        <text
          x={startX + (length * 0.6) * Math.cos(angle)}
          y={startY + (length * 0.6) * Math.sin(angle) + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-base font-bold fill-gray-800"
        >
          {tasks[taskName]?.duration || 0}
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
          <CardTitle className="flex items-center text-2xl font-bold">
            <div className="bg-yellow-400 text-black px-4 py-2 mr-4 font-bold border-2 border-black">
              Graphe CPM
            </div>
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
              <div className="w-6 h-4 rounded-full border-2 border-red-500 bg-white flex">
                <div className="w-1/2 bg-red-100 rounded-l-full flex items-center justify-center">
                  <span className="text-xs text-red-600 font-bold">ES</span>
                </div>
                <div className="w-1/2 bg-blue-100 rounded-r-full flex items-center justify-center">
                  <span className="text-xs text-blue-600 font-bold">LS</span>
                </div>
              </div>
              <span>Chemin critique (rouge)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 rounded-full border-2 border-slate-400 bg-white flex">
                <div className="w-1/2 bg-red-50 rounded-l-full flex items-center justify-center">
                  <span className="text-xs text-red-600 font-bold">ES</span>
                </div>
                <div className="w-1/2 bg-blue-50 rounded-r-full flex items-center justify-center">
                  <span className="text-xs text-blue-600 font-bold">LS</span>
                </div>
              </div>
              <span>Tâches non-critiques</span>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`relative overflow-hidden rounded-lg bg-gray-50 border-2 border-gray-300 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            height: '700px',
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
            
            {/* Arrow to FIN node for tasks without successors */}
            {Object.entries(tasks)
              .filter(([taskName]) => getSuccessors(taskName, tasks).length === 0)
              .map(([taskName]) => 
                createArrow(taskName, 'FIN', 'fin')
              )}
          </svg>

          {/* Start node */}
          {createNode('DEB', {}, positions['DEB'])}

          {/* Task nodes */}
          {Object.entries(tasks).map(([taskName, task]) => {
            const pos = positions[taskName];
            if (!pos) return null;
            return createNode(taskName, task, pos);
          })}
          
          {/* End node for tasks without successors */}
          {Object.keys(tasks).some(taskName => getSuccessors(taskName, tasks).length === 0) &&
            createNode('FIN', {}, positions.FIN || { x: 1300, y: 300 })
          }

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