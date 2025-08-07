import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, RotateCcw, Maximize } from 'lucide-react';
import { convertToGraphData } from '../lib/graph-utils';

// Custom Task Node Component
function TaskNode({ data }: { data: any }) {
  const { task, cmpNode, onEdit } = data;
  const isSpecial = task.id === 'START' || task.id === 'END';
  const isCritical = cmpNode?.isCritical || false;

  const handleClick = () => {
    if (onEdit && !isSpecial) {
      onEdit(task.id);
    }
  };

  return (
    <div className="relative" onClick={handleClick}>
      <div 
        className={`w-16 h-12 border-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 ${
          isSpecial 
            ? 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-400' 
            : isCritical 
              ? 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-400'
              : 'bg-white border-gray-800 dark:bg-slate-800 dark:border-gray-400 hover:border-blue-500'
        }`}
      >
        {isSpecial ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xs font-bold text-red-800 dark:text-red-300">
              {task.name}
            </div>
          </div>
        ) : (
          <>
            {/* EST (top-left) */}
            <div className="absolute top-1 left-2 text-xs font-bold text-black dark:text-white">
              {cmpNode?.est || 0}
            </div>
            
            {/* Horizontal separator line */}
            <div className="absolute top-1/2 left-1 right-1 h-0.5 bg-gray-800 dark:bg-gray-400" />
            
            {/* EFT (bottom-right) */}
            <div className="absolute bottom-1 right-2 text-xs font-bold text-blue-600 dark:text-blue-400">
              {cmpNode?.eft || 0}
            </div>
          </>
        )}
      </div>
      
      {/* Task label below node */}
      {!isSpecial && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-20 overflow-hidden text-ellipsis">
            {task.name || task.id}
          </div>
          <Badge variant="outline" className="text-xs mt-1 backdrop-blur-sm">
            {task.duration}j
          </Badge>
          {isCritical && (
            <Badge variant="destructive" className="text-xs mt-1 ml-1">
              Critique
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  taskNode: TaskNode,
};

interface CPMGraphProps {
  tasks: Record<string, any>;
  cmpResults: any;
  isCalculating: boolean;
  onEditTask?: (taskId: string) => void;
}

const CPMGraph: React.FC<CPMGraphProps> = ({ 
  tasks, 
  cmpResults, 
  isCalculating, 
  onEditTask 
}) => {
  // Convert tasks to ReactFlow format
  const graphData = useMemo(() => {
    if (!tasks || Object.keys(tasks).length === 0) {
      return { nodes: [], edges: [] };
    }
    return convertToGraphData(tasks, cmpResults, onEditTask);
  }, [tasks, cmpResults, onEditTask]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const fitView = useCallback(() => {
    // This will be handled by the ReactFlow instance
  }, []);

  const exportDiagram = () => {
    // Export functionality
    console.log('Exporting diagram...');
  };

  const resetView = () => {
    // Reset to fit view
    fitView();
  };

  return (
    <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-2xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Maximize className="h-6 w-6 mr-3 text-purple-500" />
            Graphe CPM Interactif
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
              onClick={resetView}
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
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 p-3 rounded-lg border border-white/20">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold">Format:</div>
              <div className="text-xs">EST (haut-gauche) | EFT (bas-droite)</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-50"></div>
              <span>Tâches critiques</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-800 bg-white"></div>
              <span>Tâches normales</span>
            </div>
          </div>
        </div>

        <div 
          className="rounded-lg border border-white/20 overflow-hidden"
          style={{ height: '600px' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900"
          >
            <Controls 
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 rounded-lg"
            />
            <MiniMap 
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 rounded-lg"
              nodeStrokeColor={(n) => {
                const node = n as any;
                return node.data?.cmpNode?.isCritical ? '#ef4444' : '#64748b';
              }}
              nodeColor={(n) => {
                const node = n as any;
                return node.data?.cmpNode?.isCritical ? '#fef2f2' : '#ffffff';
              }}
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1} 
              className="opacity-30"
            />
          </ReactFlow>

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

        {/* Critical Path Summary */}
        {cmpResults?.criticalPath && cmpResults.criticalPath.length > 0 && (
          <div className="mt-4 p-4 rounded-lg backdrop-blur-sm bg-red-50/50 dark:bg-red-900/20 border border-red-200/30">
            <h3 className="font-bold text-lg mb-2 text-red-800 dark:text-red-300">
              Chemin Critique
            </h3>
            <div className="flex flex-wrap gap-2">
              {cmpResults.criticalPath.map((taskId: string, index: number) => (
                <React.Fragment key={taskId}>
                  <Badge variant="destructive" className="font-medium">
                    {taskId}
                  </Badge>
                  {index < cmpResults.criticalPath.length - 1 && (
                    <span className="text-red-600 dark:text-red-400 font-bold">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              Durée totale: <span className="font-bold">{cmpResults.totalDuration} jours</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CPMGraph;