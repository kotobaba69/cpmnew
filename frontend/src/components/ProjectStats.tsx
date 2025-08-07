import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  BarChart3,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react';

interface ProjectStatsProps {
  tasks: Record<string, any>;
  cmpResults: any;
  isCalculating: boolean;
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ 
  tasks, 
  cmpResults, 
  isCalculating 
}) => {
  // Calculate project statistics
  const stats = React.useMemo(() => {
    if (!cmpResults || !tasks) {
      return {
        totalTasks: 0,
        criticalTasks: 0,
        totalDuration: 0,
        averageSlack: 0,
        riskLevel: 'Low' as 'Low' | 'Medium' | 'High',
        criticalPath: [],
        completionProgress: 0,
        taskDistribution: { critical: 0, high: 0, medium: 0, low: 0 }
      };
    }

    const totalTasks = Object.keys(tasks).length;
    const criticalTasks = cmpResults.criticalPath?.length || 0;
    const totalDuration = cmpResults.totalDuration || 0;
    
    // Calculate average slack for non-critical tasks
    const nonCriticalSlacks = Object.entries(cmpResults.margins || {})
      .filter(([, margin]) => margin > 0)
      .map(([, margin]) => margin as number);
    
    const averageSlack = nonCriticalSlacks.length > 0 
      ? nonCriticalSlacks.reduce((sum, slack) => sum + slack, 0) / nonCriticalSlacks.length 
      : 0;

    // Determine risk level
    const criticalRatio = criticalTasks / totalTasks;
    const riskLevel = criticalRatio > 0.7 ? 'High' : 
                     criticalRatio > 0.3 ? 'Medium' : 'Low';

    // Task distribution by slack
    const taskDistribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    Object.values(cmpResults.margins || {}).forEach((margin: any) => {
      if (margin === 0) taskDistribution.critical++;
      else if (margin <= 2) taskDistribution.high++;
      else if (margin <= 5) taskDistribution.medium++;
      else taskDistribution.low++;
    });

    return {
      totalTasks,
      criticalTasks,
      totalDuration,
      averageSlack: Math.round(averageSlack * 10) / 10,
      riskLevel,
      criticalPath: cmpResults.criticalPath || [],
      completionProgress: 0, // This would be calculated based on actual task completion
      taskDistribution
    };
  }, [tasks, cmpResults]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-600 dark:text-red-400';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'Low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  if (isCalculating) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Duration */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durée totale</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalDuration}
                </p>
                <p className="text-xs text-muted-foreground">jours</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Critical Tasks */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tâches critiques</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.criticalTasks}
                </p>
                <p className="text-xs text-muted-foreground">
                  sur {stats.totalTasks} tâches
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* Average Slack */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marge moyenne</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.averageSlack}
                </p>
                <p className="text-xs text-muted-foreground">jours</p>
              </div>
              <Timer className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Risk Level */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Niveau de risque</p>
                <Badge 
                  variant={getRiskBadgeVariant(stats.riskLevel)} 
                  className="text-lg py-1 px-3"
                >
                  {stats.riskLevel}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.criticalTasks}/{stats.totalTasks} critiques
                </p>
              </div>
              <Target className={`h-8 w-8 ${getRiskColor(stats.riskLevel)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Path Analysis */}
      <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            <TrendingUp className="h-5 w-5 mr-3 text-red-500" />
            Analyse du Chemin Critique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {stats.criticalPath.map((taskId: string, index: number) => (
              <React.Fragment key={taskId}>
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200/30">
                  <Badge variant="destructive" className="font-medium">
                    {taskId}
                  </Badge>
                  <span className="text-sm text-red-700 dark:text-red-300">
                    {tasks[taskId]?.name || taskId}
                  </span>
                  <span className="text-xs text-red-600 dark:text-red-400">
                    ({tasks[taskId]?.duration || 0}j)
                  </span>
                </div>
                {index < stats.criticalPath.length - 1 && (
                  <div className="flex items-center">
                    <span className="text-red-600 dark:text-red-400 font-bold text-lg">→</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          {stats.riskLevel === 'High' && (
            <div className="p-4 bg-red-50/50 dark:bg-red-900/20 border border-red-200/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">
                    Attention : Risque élevé
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Ce projet a un pourcentage élevé de tâches critiques ({Math.round(stats.criticalTasks / stats.totalTasks * 100)}%). 
                    Tout retard sur ces tâches impactera directement la date de fin du projet.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Distribution */}
      <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            <BarChart3 className="h-5 w-5 mr-3 text-purple-500" />
            Répartition des Tâches par Criticité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Critical Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Critiques (marge = 0)</span>
              </div>
              <Badge variant="destructive">{stats.taskDistribution.critical}</Badge>
            </div>
            <Progress 
              value={(stats.taskDistribution.critical / stats.totalTasks) * 100} 
              className="h-2"
            />
          </div>

          {/* High Risk Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Risque élevé (marge ≤ 2j)</span>
              </div>
              <Badge variant="default">{stats.taskDistribution.high}</Badge>
            </div>
            <Progress 
              value={(stats.taskDistribution.high / stats.totalTasks) * 100} 
              className="h-2"
            />
          </div>

          {/* Medium Risk Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Risque modéré (marge ≤ 5j)</span>
              </div>
              <Badge variant="secondary">{stats.taskDistribution.medium}</Badge>
            </div>
            <Progress 
              value={(stats.taskDistribution.medium / stats.totalTasks) * 100} 
              className="h-2"
            />
          </div>

          {/* Low Risk Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Faible risque (marge > 5j)</span>
              </div>
              <Badge variant="outline">{stats.taskDistribution.low}</Badge>
            </div>
            <Progress 
              value={(stats.taskDistribution.low / stats.totalTasks) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            <Target className="h-5 w-5 mr-3 text-blue-500" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.riskLevel === 'High' && (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200/30 rounded-lg">
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                Risque élevé détecté
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Considérez l'ajout de ressources supplémentaires sur les tâches critiques ou 
                la réorganisation des dépendances pour réduire le chemin critique.
              </p>
            </div>
          )}
          
          {stats.averageSlack < 2 && (
            <div className="p-3 bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-200/30 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                Marge réduite
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                La marge moyenne de {stats.averageSlack} jours est faible. 
                Planifiez des points de contrôle réguliers pour surveiller l'avancement.
              </p>
            </div>
          )}
          
          {stats.riskLevel === 'Low' && (
            <div className="p-3 bg-green-50/50 dark:bg-green-900/20 border border-green-200/30 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                Projet bien structuré
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Bon équilibre entre tâches critiques et non-critiques. 
                Le projet dispose d'une marge de manœuvre satisfaisante.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectStats;