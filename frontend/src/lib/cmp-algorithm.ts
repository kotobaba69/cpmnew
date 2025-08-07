import { Task, CPMNode, CPMResults } from '../types';

export class CPMCalculator {
  private tasks: Map<string, Task> = new Map();
  private nodes: Map<string, CPMNode> = new Map();

  constructor(tasks: Task[] | Record<string, any>) {
    this.initializeTasks(tasks);
  }

  private initializeTasks(tasks: Task[] | Record<string, any>) {
    this.tasks.clear();
    
    // Handle both array and object formats
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        this.tasks.set(task.id, task);
      });
    } else {
      // Convert object format to Task array
      Object.entries(tasks).forEach(([id, taskData]: [string, any]) => {
        const task: Task = {
          id,
          name: taskData.name || id,
          duration: taskData.duration || 0,
          predecessors: taskData.predecessors || [],
          description: taskData.description
        };
        this.tasks.set(id, task);
      });
    }

    // Add START and END nodes automatically
    this.addStartEndNodes();
  }

  private addStartEndNodes() {
    // Add START node
    if (!this.tasks.has('START')) {
      this.tasks.set('START', {
        id: 'START',
        name: 'DÉBUT',
        duration: 0,
        predecessors: []
      });
    }

    // Add END node
    if (!this.tasks.has('END')) {
      this.tasks.set('END', {
        id: 'END',
        name: 'FIN',
        duration: 0,
        predecessors: []
      });
    }

    // Connect tasks with no predecessors to START
    this.tasks.forEach((task, id) => {
      if (id !== 'START' && id !== 'END') {
        if (!task.predecessors || task.predecessors.length === 0 || 
            (task.predecessors.length === 1 && task.predecessors[0] === 'DEB')) {
          task.predecessors = ['START'];
        }
        // Replace 'DEB' with 'START' for consistency
        task.predecessors = task.predecessors.map(pred => pred === 'DEB' ? 'START' : pred);
      }
    });

    // Connect tasks with no successors to END
    const tasksWithSuccessors = new Set<string>();
    this.tasks.forEach(task => {
      task.predecessors.forEach(pred => {
        if (pred !== 'START') {
          tasksWithSuccessors.add(pred);
        }
      });
    });

    const endPredecessors: string[] = [];
    this.tasks.forEach((task, id) => {
      if (id !== 'START' && id !== 'END' && !tasksWithSuccessors.has(id)) {
        endPredecessors.push(id);
      }
    });

    if (endPredecessors.length > 0) {
      const endTask = this.tasks.get('END')!;
      endTask.predecessors = endPredecessors;
    }
  }

  public calculate(): CPMResults {
    try {
      // Validate tasks for circular dependencies
      this.validateTasks();
      
      // Initialize all nodes
      this.initializeNodes();
      
      // Forward pass (calculate EST and EFT)
      this.forwardPass();
      
      // Backward pass (calculate LST and LFT)
      this.backwardPass();
      
      // Calculate slack and identify critical path
      this.calculateSlackAndCriticalPath();
      
      return this.generateResults();
    } catch (error) {
      throw new Error(`Erreur de calcul CPM: ${error.message}`);
    }
  }

  private validateTasks() {
    // Check for circular dependencies using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        return true;
      }
      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = this.tasks.get(taskId);
      if (task) {
        for (const pred of task.predecessors) {
          if (this.tasks.has(pred) && hasCycle(pred)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const taskId of this.tasks.keys()) {
      if (hasCycle(taskId)) {
        throw new Error(`Dépendance circulaire détectée impliquant la tâche ${taskId}`);
      }
    }

    // Validate that all predecessors exist
    this.tasks.forEach((task, id) => {
      task.predecessors.forEach(pred => {
        if (!this.tasks.has(pred)) {
          throw new Error(`La tâche ${id} référence un prédécesseur inexistant: ${pred}`);
        }
      });
    });
  }

  private initializeNodes() {
    this.nodes.clear();
    this.tasks.forEach((task, id) => {
      this.nodes.set(id, {
        id,
        est: 0,
        eft: 0,
        lst: 0,
        lft: 0,
        slack: 0,
        isCritical: false
      });
    });
  }

  private forwardPass() {
    // Topological sort for forward pass
    const visited = new Set<string>();
    const sortedTasks: string[] = [];

    const topologicalSort = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = this.tasks.get(taskId);
      if (task) {
        task.predecessors.forEach(pred => {
          if (this.tasks.has(pred)) {
            topologicalSort(pred);
          }
        });
      }
      sortedTasks.push(taskId);
    };

    this.tasks.forEach((_, id) => topologicalSort(id));

    // Calculate EST and EFT
    sortedTasks.forEach(taskId => {
      const task = this.tasks.get(taskId)!;
      const node = this.nodes.get(taskId)!;

      if (taskId === 'START') {
        node.est = 0;
        node.eft = 0;
      } else {
        let maxEFT = 0;
        task.predecessors.forEach(predId => {
          const predNode = this.nodes.get(predId);
          if (predNode) {
            maxEFT = Math.max(maxEFT, predNode.eft);
          }
        });
        node.est = maxEFT;
        node.eft = node.est + task.duration;
      }
    });
  }

  private backwardPass() {
    // Reverse topological order for backward pass
    const visited = new Set<string>();
    const sortedTasks: string[] = [];

    const reverseTopologicalSort = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      // Find successors
      const successors = this.getSuccessors(taskId);
      successors.forEach(succ => reverseTopologicalSort(succ));
      
      sortedTasks.push(taskId);
    };

    this.tasks.forEach((_, id) => reverseTopologicalSort(id));

    // Calculate LST and LFT
    sortedTasks.forEach(taskId => {
      const task = this.tasks.get(taskId)!;
      const node = this.nodes.get(taskId)!;

      const successors = this.getSuccessors(taskId);
      if (successors.length === 0 || taskId === 'END') {
        // Final task - set LFT to EFT
        node.lft = node.eft;
      } else {
        let minLST = Infinity;
        successors.forEach(succId => {
          const succNode = this.nodes.get(succId);
          if (succNode) {
            minLST = Math.min(minLST, succNode.lst);
          }
        });
        node.lft = minLST;
      }
      node.lst = node.lft - task.duration;
    });
  }

  private getSuccessors(taskId: string): string[] {
    const successors: string[] = [];
    this.tasks.forEach((task, id) => {
      if (task.predecessors.includes(taskId)) {
        successors.push(id);
      }
    });
    return successors;
  }

  private calculateSlackAndCriticalPath() {
    this.nodes.forEach(node => {
      node.slack = node.lst - node.est;
      node.isCritical = node.slack === 0;
    });
  }

  private findCriticalPath(): string[] {
    const criticalPath: string[] = [];
    const visited = new Set<string>();

    const buildPath = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const node = this.nodes.get(taskId);
      if (node && node.isCritical) {
        criticalPath.push(taskId);
        
        // Find critical successors
        const successors = this.getSuccessors(taskId);
        successors.forEach(succId => {
          const succNode = this.nodes.get(succId);
          if (succNode && succNode.isCritical) {
            buildPath(succId);
          }
        });
      }
    };

    // Start from critical tasks with no critical predecessors
    this.nodes.forEach((node, id) => {
      if (node.isCritical) {
        const task = this.tasks.get(id)!;
        const hasCriticalPred = task.predecessors.some(predId => {
          const predNode = this.nodes.get(predId);
          return predNode && predNode.isCritical;
        });
        
        if (!hasCriticalPred || id === 'START') {
          buildPath(id);
        }
      }
    });

    return criticalPath.filter(id => id !== 'START' && id !== 'END');
  }

  private generateResults(): CPMResults {
    const criticalPath = this.findCriticalPath();
    const totalDuration = Math.max(...Array.from(this.nodes.values()).map(node => node.eft));
    
    // Calculate project statistics
    const criticalTasks = Array.from(this.nodes.values()).filter(node => 
      node.isCritical && node.id !== 'START' && node.id !== 'END'
    ).length;
    
    const nonZeroSlackNodes = Array.from(this.nodes.values()).filter(node => 
      node.slack > 0 && node.id !== 'START' && node.id !== 'END'
    );
    
    const averageSlack = nonZeroSlackNodes.length > 0 
      ? nonZeroSlackNodes.reduce((sum, node) => sum + node.slack, 0) / nonZeroSlackNodes.length 
      : 0;

    const riskLevel = criticalTasks > (this.tasks.size * 0.7) ? 'High' :
                     criticalTasks > (this.tasks.size * 0.3) ? 'Medium' : 'Low';

    return {
      nodes: this.nodes,
      criticalPath,
      totalDuration,
      projectStats: {
        totalTasks: this.tasks.size - 2, // Exclude START and END
        criticalTasks,
        averageSlack: Math.round(averageSlack * 10) / 10,
        riskLevel
      }
    };
  }

  // Utility methods for compatibility with existing code
  public getEarliestStart(taskId: string): number {
    return this.nodes.get(taskId)?.est || 0;
  }

  public getEarliestFinish(taskId: string): number {
    return this.nodes.get(taskId)?.eft || 0;
  }

  public getLatestStart(taskId: string): number {
    return this.nodes.get(taskId)?.lst || 0;
  }

  public getLatestFinish(taskId: string): number {
    return this.nodes.get(taskId)?.lft || 0;
  }

  public getSlack(taskId: string): number {
    return this.nodes.get(taskId)?.slack || 0;
  }

  public isCritical(taskId: string): boolean {
    return this.nodes.get(taskId)?.isCritical || false;
  }
}

// Helper function to maintain compatibility with existing code
export const calculateCPM = (tasks: any): any => {
  try {
    const calculator = new CPMCalculator(tasks);
    const results = calculator.calculate();
    
    // Convert to the format expected by existing components
    const earliestStart: Record<string, number> = {};
    const earliestFinish: Record<string, number> = {};
    const latestStart: Record<string, number> = {};
    const latestFinish: Record<string, number> = {};
    const margins: Record<string, number> = {};
    const criticalPath: string[] = [];

    results.nodes.forEach((node, id) => {
      earliestStart[id] = node.est;
      earliestFinish[id] = node.eft;
      latestStart[id] = node.lst;
      latestFinish[id] = node.lft;
      margins[id] = node.slack;
      
      if (node.isCritical && id !== 'START' && id !== 'END') {
        criticalPath.push(id);
      }
    });

    return {
      earliestStart,
      earliestFinish,
      latestStart,
      latestFinish,
      margins,
      totalDuration: results.totalDuration,
      criticalPath
    };
  } catch (error) {
    console.error('Erreur lors du calcul CPM:', error);
    throw error;
  }
};