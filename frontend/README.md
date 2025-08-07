# CPM Dashboard - Outil d'Ordonnancement de Projets

Une application moderne et interactive pour la gestion de projets utilisant la méthode CPM (Critical Path Method) avec une interface utilisateur avancée et des fonctionnalités d'analyse poussées.

## ✨ Fonctionnalités

### 🎯 Gestion de Projets CPM
- **Algorithme CPM complet** : Calcul automatique des dates au plus tôt/tard, marges libres et chemin critique
- **Nœuds START/END automatiques** : Gestion intelligente des jalons de début et fin de projet
- **Validation robuste** : Détection des dépendances circulaires et validation des données
- **Analyse de risque** : Classification des tâches par niveau de criticité

### 📊 Visualisation Interactive
- **Graphe CPM avec ReactFlow** : Visualisation interactive des réseaux de tâches
- **Nœuds ovales académiques** : Format standard avec EST (haut-gauche) et EFT (bas-droite)
- **Indicateurs visuels** : Différenciation claire des tâches critiques et non-critiques
- **Navigation fluide** : Zoom, panoramique et mini-carte pour les gros projets

### 📋 Gestion des Tâches
- **Interface intuitive** : Formulaires modaux avec validation en temps réel
- **Gestion des dépendances** : Sélection simple des prédécesseurs avec validation
- **Tableau complet** : Tri, filtrage et recherche avancée des tâches
- **Actions rapides** : Édition et suppression avec confirmations

### 📈 Statistiques et Analyse
- **Métriques de projet** : Durée totale, tâches critiques, marge moyenne
- **Analyse de risque** : Classification automatique (Faible/Moyen/Élevé)
- **Répartition des tâches** : Visualisation par niveau de criticité
- **Recommandations** : Conseils automatiques basés sur l'analyse

### 💾 Import/Export
- **Export CSV** : Données complètes d'analyse CPM
- **Sauvegarde de projets** : Gestion locale des projets
- **Formats compatibles** : Importation facile depuis Excel ou autres outils

## 🛠️ Technologies

- **React 19** : Framework frontend moderne
- **TypeScript** : Types robustes pour la fiabilité
- **ReactFlow** : Visualisation de graphes interactive
- **TailwindCSS** : Styling moderne et responsive
- **ShadCN/UI** : Composants d'interface élégants
- **Lucide React** : Icônes modernes

## 🚀 Installation

### Prérequis
- Node.js 18+ ou Yarn 1.22+
- Un navigateur moderne

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd cpmnew/frontend
   ```

2. **Installer les dépendances**
   ```bash
   yarn install
   ```

3. **Lancer l'application**
   ```bash
   yarn start
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## 📖 Guide d'utilisation

### 1. Création d'un projet
1. Lancez l'application
2. Utilisez les données d'exemple ou créez un nouveau projet
3. Ajoutez vos tâches avec le bouton "Nouvelle Tâche"

### 2. Définition des tâches
- **ID** : Identifiant unique (A, B, C, etc.)
- **Nom** : Description de la tâche
- **Durée** : Temps nécessaire en jours
- **Prédécesseurs** : Tâches qui doivent être terminées avant

### 3. Calcul CPM
- Cliquez sur "Calculer CPM" pour lancer l'analyse
- Le système calcule automatiquement :
  - Dates au plus tôt (EST/EFT)
  - Dates au plus tard (LST/LFT)
  - Marges libres
  - Chemin critique

### 4. Analyse des résultats

#### Onglet Vue d'ensemble
- Formulaire de création de tâches
- Tableau des tâches avec indicateurs
- Statistiques de base du projet

#### Onglet Gestion des tâches
- Tableau complet avec tri et filtrage
- Recherche par nom ou description
- Actions d'édition et suppression

#### Onglet Graphe CPM
- Visualisation interactive du réseau
- Nœuds ovales avec EST/EFT
- Chemin critique en rouge
- Navigation avec zoom et panoramique

#### Onglet Statistiques
- Métriques détaillées du projet
- Analyse du chemin critique
- Répartition des tâches par criticité
- Recommandations automatiques

### 5. Export et sauvegarde
- **Export CSV** : Bouton "Export CSV" dans le tableau
- **Sauvegarde** : Bouton "Sauvegarder" dans l'en-tête
- **Chargement** : Bouton "Projets" pour gérer les projets sauvegardés

## 🎨 Interface utilisateur

### Thèmes
- **Mode clair/sombre** : Basculement automatique selon les préférences système
- **Effets visuels** : Glassmorphism avec backdrop-blur
- **Animations** : Transitions fluides et micro-interactions

### Responsive Design
- **Mobile-first** : Interface adaptée aux écrans mobiles
- **Tablettes** : Optimisation pour les tablettes
- **Desktop** : Exploitation maximale des grands écrans

## 📊 Format des données

### Structure des tâches
```javascript
{
  'A': {
    name: 'Analyse des besoins',
    duration: 8,
    predecessors: ['DEB'], // ou ['START']
    description: 'Description optionnelle'
  },
  'B': {
    name: 'Conception',
    duration: 12,
    predecessors: ['A'],
    description: 'Phase de conception'
  }
  // ...
}
```

### Résultats CPM
```javascript
{
  earliestStart: { 'A': 0, 'B': 8, ... },
  earliestFinish: { 'A': 8, 'B': 20, ... },
  latestStart: { 'A': 0, 'B': 8, ... },
  latestFinish: { 'A': 8, 'B': 20, ... },
  margins: { 'A': 0, 'B': 0, ... },
  totalDuration: 44,
  criticalPath: ['A', 'B', 'C', ...]
}
```

## 🔧 Architecture technique

### Structure des fichiers
```
src/
├── components/          # Composants React
│   ├── CPMDashboard.jsx     # Composant principal
│   ├── CPMGraph.tsx         # Graphe ReactFlow
│   ├── TaskFormEnhanced.tsx # Formulaire de tâches
│   ├── TaskTableEnhanced.tsx# Tableau des tâches
│   ├── ProjectStats.tsx     # Statistiques
│   └── ui/                  # Composants UI de base
├── lib/                 # Logique métier
│   ├── cmp-algorithm.ts     # Algorithme CPM
│   └── graph-utils.ts       # Utilitaires graphiques
├── types/               # Types TypeScript
│   └── index.ts             # Définitions de types
├── data/                # Données d'exemple
│   └── mockData.js          # Projet d'exemple
└── utils/               # Utilitaires
    └── cpmCalculations.js   # Compatibilité
```

### Algorithme CPM

L'application utilise un algorithme CPM robuste avec :

1. **Validation des données** : Vérification des dépendances circulaires
2. **Forward Pass** : Calcul des dates au plus tôt (EST/EFT)
3. **Backward Pass** : Calcul des dates au plus tard (LST/LFT)
4. **Analyse critique** : Identification des tâches critiques (marge = 0)
5. **Construction du chemin critique** : Séquence des tâches critiques

## 🐛 Dépannage

### Problèmes courants

**L'application ne démarre pas**
- Vérifiez que Node.js 18+ est installé
- Supprimez `node_modules` et relancez `yarn install`

**Erreurs de calcul CPM**
- Vérifiez qu'il n'y a pas de dépendances circulaires
- Assurez-vous que toutes les tâches ont des durées positives

**Graphe ne s'affiche pas**
- Vérifiez que ReactFlow est installé : `yarn list reactflow`
- Rechargez la page si le calcul CPM est en cours

**Export CSV ne fonctionne pas**
- Vérifiez que le calcul CPM a été effectué
- Assurez-vous que le navigateur autorise les téléchargements

### Logs de débogage
Ouvrez la console développeur (F12) pour voir les messages de débogage détaillés.

## 🤝 Contribution

### Développement local
1. Fork du repository
2. Création d'une branche feature
3. Développement avec tests
4. Pull request avec description détaillée

### Standards de code
- **ESLint** : Respect des règles de codage
- **Prettier** : Formatage automatique
- **TypeScript** : Types stricts obligatoires
- **Tests** : Couverture des fonctionnalités critiques

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙋 Support

Pour toute question ou problème :
1. Consultez cette documentation
2. Vérifiez les [Issues GitHub](../../issues)
3. Créez une nouvelle issue avec un exemple reproductible

---

## 📅 Roadmap

### Version future
- [ ] Support de la méthode PERT (3 estimations)
- [ ] Gestion des ressources et coûts
- [ ] Calendriers de travail personnalisés
- [ ] Collaboration multi-utilisateurs
- [ ] API REST pour intégration
- [ ] Export PDF des graphiques
- [ ] Modèles de projets prédéfinis

---

*Développé avec ❤️ pour la gestion de projets moderne*