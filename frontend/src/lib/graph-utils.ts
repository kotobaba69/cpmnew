import { Task, CPMNode, GraphNode, GraphEdge, TaskFormData, ValidationError } from '../types';

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const convertToGraphData = (
  tasks: Record<string, any>, 
  cmpResults: any,
  onEdit?: (taskId: string) => void
): GraphData => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create nodes with optimal positioning
  const layout = generateOptimalLayout(tasks);
  
  // Add START node
  nodes.push({
    id: 'START',
    type: 'taskNode',
    position: layout['START'] || { x: 50, y: 300 },
    data: {
      task: {
        id: 'START',
        name: 'DÉBUT',
        duration: 0,
        predecessors: []
      },
      cmpNode: cmpResults.nodes?.get('START'),
      onEdit
    },
    style: {
      width: 120,
      height: 80,
      borderRadius: '50%',
      fontSize: '12px'
    }
  });

  // Add task nodes
  Object.entries(tasks).forEach(([taskId, taskData]: [string, any]) => {
    if (taskId === 'START' || taskId === 'END') return;

    const position = layout[taskId] || { x: 200, y: 200 };
    
    nodes.push({
      id: taskId,
      type: 'taskNode',
      position,
      data: {
        task: {
          id: taskId,
          name: taskData.name || taskId,
          duration: taskData.duration || 0,
          predecessors: taskData.predecessors || [],
          description: taskData.description
        },
        cmpNode: cmpResults.nodes?.get(taskId),
        onEdit
      },
      style: {
        width: 120,
        height: 80,
        borderRadius: '50%',
        fontSize: '12px'
      }
    });

    // Create edges from predecessors
    (taskData.predecessors || []).forEach((predId: string) => {
      const actualPredId = predId === 'DEB' ? 'START' : predId;
      const isCritical = cmpResults.margins && 
        cmpResults.margins[taskId] === 0 && 
        cmpResults.margins[actualPredId] === 0;

      edges.push({
        id: `${actualPredId}-${taskId}`,
        source: actualPredId,
        target: taskId,
        type: 'smoothstep',
        style: {
          stroke: isCritical ? '#ef4444' : '#64748b',
          strokeWidth: isCritical ? 3 : 2
        },
        animated: isCritical
      });
    });
  });

  // Add END node and connect orphaned tasks
  const tasksWithSuccessors = new Set<string>();
  Object.entries(tasks).forEach(([, taskData]: [string, any]) => {
    (taskData.predecessors || []).forEach((pred: string) => {
      if (pred !== 'DEB' && pred !== 'START') {
        tasksWithSuccessors.add(pred);
      }
    });
  });

  const orphanedTasks = Object.keys(tasks).filter(taskId => 
    !tasksWithSuccessors.has(taskId) && taskId !== 'START' && taskId !== 'END'
  );

  if (orphanedTasks.length > 0) {
    nodes.push({
      id: 'END',
      type: 'taskNode',
      position: layout['END'] || { x: 800, y: 300 },
      data: {
        task: {
          id: 'END',
          name: 'FIN',
          duration: 0,
          predecessors: orphanedTasks
        },
        cmpNode: cmpResults.nodes?.get('END'),
        onEdit
      },
      style: {
        width: 120,
        height: 80,
        borderRadius: '50%',
        fontSize: '12px'
      }
    });

    orphanedTasks.forEach(taskId => {
      const isCritical = cmpResults.margins && cmpResults.margins[taskId] === 0;
      
      edges.push({
        id: `${taskId}-END`,
        source: taskId,
        target: 'END',
        type: 'smoothstep',
        style: {
          stroke: isCritical ? '#ef4444' : '#64748b',
          strokeWidth: isCritical ? 3 : 2
        },
        animated: isCritical
      });
    });
  }

  return { nodes, edges };
};

export const generateOptimalLayout = (tasks: Record<string, any>): Record<string, { x: number; y: number }> => {
  const layout: Record<string, { x: number; y: number }> = {};
  const levels: Record<string, number> = {};
  
  // Calculate levels using topological sort
  const visited = new Set<string>();
  const tempStack = new Set<string>();
  
  const calculateLevel = (taskId: string): number => {
    if (tempStack.has(taskId)) {
      throw new Error(`Dépendance circulaire détectée: ${taskId}`);
    }
    if (visited.has(taskId)) {
      return levels[taskId] || 0;
    }
    
    visited.add(taskId);
    tempStack.add(taskId);
    
    let maxLevel = 0;
    const task = tasks[taskId];
    if (task && task.predecessors) {
      task.predecessors.forEach((predId: string) => {
        const actualPredId = predId === 'DEB' ? 'START' : predId;
        if (actualPredId === 'START') {
          maxLevel = Math.max(maxLevel, 1);
        } else if (tasks[actualPredId]) {
          maxLevel = Math.max(maxLevel, calculateLevel(actualPredId) + 1);
        }
      });
    }
    
    tempStack.delete(taskId);
    levels[taskId] = maxLevel;
    return maxLevel;
  };
  
  // Set START at level 0
  levels['START'] = 0;
  visited.add('START');
  
  // Calculate levels for all tasks
  Object.keys(tasks).forEach(taskId => {
    if (taskId !== 'START' && taskId !== 'END') {
      calculateLevel(taskId);
    }
  });
  
  // Group tasks by level
  const tasksByLevel: Record<number, string[]> = {};
  Object.entries(levels).forEach(([taskId, level]) => {
    if (!tasksByLevel[level]) {
      tasksByLevel[level] = [];
    }
    tasksByLevel[level].push(taskId);
  });
  
  // Position tasks
  const LEVEL_WIDTH = 250;
  const TASK_HEIGHT = 120;
  const BASE_Y = 300;
  
  Object.entries(tasksByLevel).forEach(([levelStr, taskIds]) => {
    const level = parseInt(levelStr);
    const x = level * LEVEL_WIDTH + 100;
    
    taskIds.forEach((taskId, index) => {
      const tasksInLevel = taskIds.length;
      const y = BASE_Y + (index - (tasksInLevel - 1) / 2) * TASK_HEIGHT;
      
      layout[taskId] = { x, y };
    });
  });
  
  // Position END node
  const maxLevel = Math.max(...Object.values(levels));
  layout['END'] = { x: (maxLevel + 1) * LEVEL_WIDTH + 100, y: BASE_Y };
  
  return layout;
};

export const createSampleProjectData = (): Record<string, any> => {
  return {
    'A': { duration: 8, predecessors: ['DEB'], name: 'Analyse des besoins' },
    'B': { duration: 12, predecessors: ['DEB'], name: 'Conception architecture' },
    'C': { duration: 6, predecessors: ['A'], name: 'Développement frontend' },
    'D': { duration: 8, predecessors: ['A'], name: 'Développement backend' },
    'E': { duration: 4, predecessors: ['B'], name: 'Configuration serveur' },
    'F': { duration: 10, predecessors: ['C', 'D'], name: 'Intégration système' },
    'G': { duration: 6, predecessors: ['E'], name: 'Tests de sécurité' },
    'H': { duration: 8, predecessors: ['F', 'G'], name: 'Tests d\'acceptation' },
    'I': { duration: 4, predecessors: ['H'], name: 'Documentation' },
    'J': { duration: 6, predecessors: ['H'], name: 'Formation utilisateurs' },
    'K': { duration: 8, predecessors: ['I', 'J'], name: 'Déploiement production' },
    'L': { duration: 4, predecessors: ['K'], name: 'Support post-déploiement' }
  };
};

export const exportToCSV = (tasks: Record<string, any>, cmpResults: any): string => {
  const headers = [
    'Tâche',
    'Nom',
    'Durée',
    'Prédécesseurs',
    'Début au plus tôt',
    'Fin au plus tôt',
    'Début au plus tard',
    'Fin au plus tard',
    'Marge libre',
    'Critique'
  ];
  
  const rows = [headers.join(',')];
  
  Object.entries(tasks).forEach(([taskId, taskData]: [string, any]) => {
    if (taskId === 'START' || taskId === 'END') return;
    
    const row = [
      taskId,
      `"${taskData.name || taskId}"`,
      taskData.duration || 0,
      `"${(taskData.predecessors || []).join(', ')}"`,
      cmpResults.earliestStart?.[taskId] || 0,
      cmpResults.earliestFinish?.[taskId] || 0,
      cmpResults.latestStart?.[taskId] || 0,
      cmpResults.latestFinish?.[taskId] || 0,
      cmpResults.margins?.[taskId] || 0,
      (cmpResults.margins?.[taskId] === 0) ? 'Oui' : 'Non'
    ];
    
    rows.push(row.join(','));
  });
  
  return rows.join('\\n');
};

export const validateTaskData = (
  taskData: TaskFormData, 
  existingTasks: Record<string, any>
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate task ID
  if (!taskData.id || taskData.id.trim() === '') {
    errors.push({ field: 'id', message: 'L\'identifiant de la tâche est requis' });
  } else if (existingTasks[taskData.id.toUpperCase()]) {
    errors.push({ field: 'id', message: 'Une tâche avec cet identifiant existe déjà' });
  }
  
  // Validate task name
  if (!taskData.name || taskData.name.trim() === '') {
    errors.push({ field: 'name', message: 'Le nom de la tâche est requis' });
  }
  
  // Validate duration
  if (!taskData.duration || taskData.duration < 1) {
    errors.push({ field: 'duration', message: 'La durée doit être supérieure à 0' });
  }
  
  // Validate predecessors
  if (taskData.predecessors && taskData.predecessors.length > 0) {
    taskData.predecessors.forEach(predId => {
      if (predId !== 'DEB' && predId !== 'START' && !existingTasks[predId]) {
        errors.push({ 
          field: 'predecessors', 
          message: `Le prédécesseur "${predId}" n'existe pas` 
        });
      }
    });
    
    // Check for self-dependency
    if (taskData.predecessors.includes(taskData.id)) {
      errors.push({ 
        field: 'predecessors', 
        message: 'Une tâche ne peut pas dépendre d\'elle-même' 
      });
    }
  }
  
  return errors;
};

export const generateUniqueTaskId = (existingTasks: Record<string, any>): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let i = 0; i < letters.length; i++) {
    const id = letters[i];
    if (!existingTasks[id]) {
      return id;
    }
  }
  
  // If all single letters are taken, use double letters
  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
      const id = letters[i] + letters[j];
      if (!existingTasks[id]) {
        return id;
      }
    }
  }
  
  // Fallback to timestamp-based ID
  return `T${Date.now().toString().slice(-6)}`;
};

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};