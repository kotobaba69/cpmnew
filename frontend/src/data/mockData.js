export const initialTasks = {
  'A': { duration: 8, predecessors: ['DEB'], name: 'Étude préliminaire' },
  'B': { duration: 12, predecessors: ['DEB'], name: 'Conception architecture' },
  'C': { duration: 8, predecessors: ['A'], name: 'Développement module 1' },
  'D': { duration: 4, predecessors: ['A'], name: 'Tests unitaires' },
  'E': { duration: 16, predecessors: ['A'], name: 'Interface utilisateur' },
  'F': { duration: 4, predecessors: ['B'], name: 'Configuration serveur' },
  'G': { duration: 20, predecessors: ['C', 'D'], name: 'Intégration système' },
  'H': { duration: 16, predecessors: ['E', 'F', 'G'], name: 'Tests intégration' },
  'I': { duration: 12, predecessors: ['C', 'D'], name: 'Documentation' },
  'J': { duration: 20, predecessors: ['E', 'F', 'G'], name: 'Tests utilisateur' },
  'K': { duration: 20, predecessors: ['H', 'I', 'J'], name: 'Déploiement' },
  'L': { duration: 24, predecessors: ['H', 'I', 'J'], name: 'Formation équipe' }
};

export const savedProjects = [
  {
    id: '1',
    name: 'Projet Développement App',
    tasks: initialTasks,
    createdAt: '2024-01-15',
    lastModified: '2024-01-20'
  },
  {
    id: '2',
    name: 'Migration Infrastructure',
    tasks: {
      'A': { duration: 5, predecessors: ['DEB'], name: 'Audit existant' },
      'B': { duration: 10, predecessors: ['A'], name: 'Plan migration' },
      'C': { duration: 15, predecessors: ['B'], name: 'Migration données' },
      'D': { duration: 8, predecessors: ['C'], name: 'Tests validation' }
    },
    createdAt: '2024-01-10',
    lastModified: '2024-01-18'
  }
];