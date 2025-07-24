export const calculateCPM = (tasks) => {
  // 1. Calcul des dates au plus tôt
  const earliestStart = { 'DEB': 0 };
  const earliestFinish = { 'DEB': 0 };
  const order = topologicalSort(tasks);
  
  order.forEach(task => {
    if (task === 'DEB') return;
    
    const predecessors = tasks[task].predecessors;
    let max = 0;
    predecessors.forEach(pred => {
      if (earliestFinish[pred] > max) {
        max = earliestFinish[pred];
      }
    });
    earliestStart[task] = max;
    earliestFinish[task] = max + tasks[task].duration;
  });

  // 2. Calcul des dates au plus tard
  const totalDuration = Math.max(...Object.values(earliestFinish));
  const latestFinish = {};
  const latestStart = {};
  
  order.reverse().forEach(task => {
    if (task === 'DEB') {
      latestFinish[task] = 0;
      latestStart[task] = 0;
      return;
    }
    
    const successors = getSuccessors(task, tasks);
    if (successors.length === 0) {
      latestFinish[task] = totalDuration;
    } else {
      let min = Infinity;
      successors.forEach(succ => {
        if (latestStart[succ] < min) {
          min = latestStart[succ];
        }
      });
      latestFinish[task] = min;
    }
    latestStart[task] = latestFinish[task] - tasks[task].duration;
  });

  // 3. Calcul des marges
  const margins = {};
  Object.keys(tasks).forEach(task => {
    margins[task] = latestStart[task] - earliestStart[task];
  });

  // 4. Chemin critique
  const criticalPath = Object.keys(tasks).filter(task => margins[task] === 0);

  return {
    earliestStart,
    earliestFinish,
    latestStart,
    latestFinish,
    margins,
    totalDuration,
    criticalPath
  };
};

export const topologicalSort = (tasks) => {
  const nodes = new Set(['DEB', ...Object.keys(tasks)]);
  const visited = new Set();
  const temp = new Set();
  const result = [];
  
  function visit(node) {
    if (temp.has(node)) throw new Error("Cycle détecté dans le graphe");
    if (visited.has(node)) return;
    
    temp.add(node);
    const successors = node === 'DEB' ? 
      Object.keys(tasks).filter(t => tasks[t].predecessors.includes('DEB')) :
      getSuccessors(node, tasks);
    
    successors.forEach(visit);
    temp.delete(node);
    visited.add(node);
    result.unshift(node);
  }
  
  nodes.forEach(visit);
  return result;
};

export const getSuccessors = (task, tasks) => {
  return Object.keys(tasks).filter(t => 
    tasks[t].predecessors.includes(task)
  );
};

export const validateTask = (taskName, duration, predecessors, existingTasks) => {
  const errors = [];
  
  if (!taskName || taskName.trim() === '') {
    errors.push('Le nom de la tâche est requis');
  }
  
  if (existingTasks[taskName.toUpperCase()]) {
    errors.push('Une tâche avec ce nom existe déjà');
  }
  
  if (!duration || duration < 1) {
    errors.push('La durée doit être supérieure à 0');
  }
  
  if (predecessors && predecessors.length > 0) {
    predecessors.forEach(pred => {
      if (pred !== 'DEB' && !existingTasks[pred]) {
        errors.push(`L'antécédent "${pred}" n'existe pas`);
      }
    });
  }
  
  return errors;
};