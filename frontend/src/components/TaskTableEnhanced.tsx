import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Edit3, 
  Trash2, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Filter,
  Download,
  Eye,
  EyeOff,
  BarChart3
} from 'lucide-react';
import { exportToCSV, downloadFile } from '../lib/graph-utils';
import { useToast } from '../hooks/use-toast';

type SortField = 'id' | 'name' | 'duration' | 'est' | 'eft' | 'lst' | 'lft' | 'slack';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'critical' | 'high-risk' | 'medium-risk' | 'low-risk';

interface TaskTableEnhancedProps {
  tasks: Record<string, any>;
  cmpResults: any;
  onUpdateTask?: (taskId: string, taskData: any) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (taskId: string) => void;
  fullView?: boolean;
  isCalculating?: boolean;
}

const TaskTableEnhanced: React.FC<TaskTableEnhancedProps> = ({
  tasks,
  cmpResults,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  fullView = false,
  isCalculating = false
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    duration: true,
    predecessors: true,
    est: true,
    eft: true,
    lst: true,
    lft: true,
    slack: true,
    critical: true
  });

  // Filter and sort tasks
  const processedTasks = useMemo(() => {
    const taskEntries = Object.entries(tasks).filter(([taskId]) => 
      taskId !== 'START' && taskId !== 'END'
    );

    // Apply search filter
    let filtered = taskEntries.filter(([taskId, taskData]) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        taskId.toLowerCase().includes(searchLower) ||
        (taskData.name || '').toLowerCase().includes(searchLower) ||
        (taskData.description || '').toLowerCase().includes(searchLower)
      );
    });

    // Apply type filter
    if (filterType !== 'all' && cmpResults?.margins) {
      filtered = filtered.filter(([taskId]) => {
        const slack = cmpResults.margins[taskId] || 0;
        switch (filterType) {
          case 'critical':
            return slack === 0;
          case 'high-risk':
            return slack > 0 && slack <= 2;
          case 'medium-risk':
            return slack > 2 && slack <= 5;
          case 'low-risk':
            return slack > 5;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort(([aId, aData], [bId, bData]) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'id':
          aValue = aId;
          bValue = bId;
          break;
        case 'name':
          aValue = aData.name || aId;
          bValue = bData.name || bId;
          break;
        case 'duration':
          aValue = aData.duration || 0;
          bValue = bData.duration || 0;
          break;
        case 'est':
          aValue = cmpResults?.earliestStart?.[aId] || 0;
          bValue = cmpResults?.earliestStart?.[bId] || 0;
          break;
        case 'eft':
          aValue = cmpResults?.earliestFinish?.[aId] || 0;
          bValue = cmpResults?.earliestFinish?.[bId] || 0;
          break;
        case 'lst':
          aValue = cmpResults?.latestStart?.[aId] || 0;
          bValue = cmpResults?.latestStart?.[bId] || 0;
          break;
        case 'lft':
          aValue = cmpResults?.latestFinish?.[aId] || 0;
          bValue = cmpResults?.latestFinish?.[bId] || 0;
          break;
        case 'slack':
          aValue = cmpResults?.margins?.[aId] || 0;
          bValue = cmpResults?.margins?.[bId] || 0;
          break;
        default:
          aValue = aId;
          bValue = bId;
      }

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? result : -result;
    });

    return filtered;
  }, [tasks, cmpResults, searchTerm, sortField, sortDirection, filterType]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />;
  };

  const handleDeleteTask = (taskId: string) => {
    if (onDeleteTask) {
      onDeleteTask(taskId);
      toast({
        title: "Tâche supprimée",
        description: `La tâche "${taskId}" a été supprimée avec succès.`,
      });
    }
    setDeletingTask(null);
  };

  const handleExportCSV = () => {
    try {
      const csvContent = exportToCSV(tasks, cmpResults);
      downloadFile(csvContent, 'cpm-analysis.csv', 'text/csv');
      toast({
        title: "Export réussi",
        description: "Les données ont été exportées en CSV.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export.",
        variant: "destructive",
      });
    }
  };

  const getCriticalityBadge = (taskId: string) => {
    if (!cmpResults?.margins) return null;
    
    const slack = cmpResults.margins[taskId] || 0;
    if (slack === 0) {
      return <Badge variant="destructive">Critique</Badge>;
    } else if (slack <= 2) {
      return <Badge variant="default">Risque élevé</Badge>;
    } else if (slack <= 5) {
      return <Badge variant="secondary">Risque modéré</Badge>;
    } else {
      return <Badge variant="outline">Faible risque</Badge>;
    }
  };

  const getTaskStats = () => {
    const total = processedTasks.length;
    const critical = processedTasks.filter(([taskId]) => 
      cmpResults?.margins?.[taskId] === 0
    ).length;
    const filtered = processedTasks.length;
    
    return { total, critical, filtered };
  };

  const stats = getTaskStats();

  return (
    <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-2xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="flex items-center text-2xl font-bold">
            <BarChart3 className="h-6 w-6 mr-3 text-blue-500" />
            Tableau des Tâches
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
              onClick={handleExportCSV}
              disabled={isCalculating}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 hover:bg-white/90"
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stats.total} tâches au total</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{stats.critical} critiques</Badge>
          </div>
          {stats.filtered !== stats.total && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.filtered} affichées</Badge>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID, nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les tâches</SelectItem>
              <SelectItem value="critical">Tâches critiques</SelectItem>
              <SelectItem value="high-risk">Risque élevé</SelectItem>
              <SelectItem value="medium-risk">Risque modéré</SelectItem>
              <SelectItem value="low-risk">Faible risque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {visibleColumns.id && (
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-2">
                      ID {getSortIcon('id')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.name && (
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Nom {getSortIcon('name')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.duration && (
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors text-center"
                    onClick={() => handleSort('duration')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Durée {getSortIcon('duration')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.predecessors && (
                  <TableHead>Prédécesseurs</TableHead>
                )}
                {visibleColumns.est && cmpResults && (
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors text-center"
                    onClick={() => handleSort('est')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      EST {getSortIcon('est')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.eft && cmpResults && (
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors text-center"
                    onClick={() => handleSort('eft')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      EFT {getSortIcon('eft')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.lst && cmpResults && (
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors text-center"
                    onClick={() => handleSort('lst')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      LST {getSortIcon('lst')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.lft && cmpResults && (
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors text-center"
                    onClick={() => handleSort('lft')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      LFT {getSortIcon('lft')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.slack && cmpResults && (
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors text-center"
                    onClick={() => handleSort('slack')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Marge {getSortIcon('slack')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.critical && cmpResults && (
                  <TableHead className="text-center">Status</TableHead>
                )}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedTasks.map(([taskId, taskData]) => {
                const isCritical = cmpResults?.margins?.[taskId] === 0;
                
                return (
                  <TableRow 
                    key={taskId}
                    className={`transition-colors hover:bg-muted/50 ${
                      isCritical ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-500' : ''
                    }`}
                  >
                    {visibleColumns.id && (
                      <TableCell className="font-mono font-bold">
                        {taskId}
                      </TableCell>
                    )}
                    {visibleColumns.name && (
                      <TableCell>
                        <div className="max-w-48 truncate" title={taskData.name || taskId}>
                          {taskData.name || taskId}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.duration && (
                      <TableCell className="text-center">
                        <Badge variant="outline">{taskData.duration || 0}j</Badge>
                      </TableCell>
                    )}
                    {visibleColumns.predecessors && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(taskData.predecessors || []).map((pred: string) => (
                            <Badge key={pred} variant="secondary" className="text-xs">
                              {pred === 'DEB' ? 'DÉBUT' : pred}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.est && cmpResults && (
                      <TableCell className="text-center font-mono">
                        {cmpResults.earliestStart?.[taskId] || 0}
                      </TableCell>
                    )}
                    {visibleColumns.eft && cmpResults && (
                      <TableCell className="text-center font-mono">
                        {cmpResults.earliestFinish?.[taskId] || 0}
                      </TableCell>
                    )}
                    {visibleColumns.lst && cmpResults && (
                      <TableCell className="text-center font-mono">
                        {cmpResults.latestStart?.[taskId] || 0}
                      </TableCell>
                    )}
                    {visibleColumns.lft && cmpResults && (
                      <TableCell className="text-center font-mono">
                        {cmpResults.latestFinish?.[taskId] || 0}
                      </TableCell>
                    )}
                    {visibleColumns.slack && cmpResults && (
                      <TableCell className="text-center">
                        <Badge 
                          variant={isCritical ? "destructive" : "outline"}
                          className="font-mono"
                        >
                          {cmpResults.margins?.[taskId] || 0}j
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.critical && cmpResults && (
                      <TableCell className="text-center">
                        {getCriticalityBadge(taskId)}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {onEditTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditTask(taskId)}
                            disabled={isCalculating}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTask(taskId)}
                            disabled={isCalculating}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {processedTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterType !== 'all' 
                ? 'Aucune tâche ne correspond aux critères de recherche.'
                : 'Aucune tâche définie.'
              }
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la tâche "{deletingTask}" ? 
              Cette action est irréversible et peut affecter les dépendances d'autres tâches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTask && handleDeleteTask(deletingTask)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default TaskTableEnhanced;