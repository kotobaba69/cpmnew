import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Edit, Trash2, GripVertical, Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const TaskTable = ({ tasks, cmpResults, onUpdateTask, onDeleteTask, onReorderTasks, fullView = false }) => {
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);

  const handleEditTask = (taskName) => {
    setEditingTask(taskName);
    setEditForm({
      name: taskName,
      description: tasks[taskName].name,
      duration: tasks[taskName].duration,
      predecessors: tasks[taskName].predecessors.join(', ')
    });
  };

  const handleSaveEdit = () => {
    const predecessors = editForm.predecessors
      .split(',')
      .map(p => p.trim().toUpperCase())
      .filter(p => p !== '');

    onUpdateTask(editingTask, {
      description: editForm.description,
      duration: parseInt(editForm.duration),
      predecessors: predecessors.length ? predecessors : ['DEB']
    });

    setEditingTask(null);
    setEditForm({});
  };

  const handleDeleteTask = (taskName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la tâche ${taskName} ?`)) {
      onDeleteTask(taskName);
    }
  };

  const handleDragStart = (e, taskName) => {
    setDraggedTask(taskName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetTask) => {
    e.preventDefault();
    if (draggedTask && draggedTask !== targetTask) {
      // Mock reorder functionality
      toast({
        title: "Tâches réorganisées",
        description: `${draggedTask} déplacé vers ${targetTask}`,
      });
    }
    setDraggedTask(null);
  };

  const getTaskStatus = (taskName) => {
    if (!cmpResults.margins) return { status: 'pending', color: 'slate' };
    
    const margin = cmpResults.margins[taskName];
    if (margin === 0) return { status: 'critical', color: 'red' };
    if (margin <= 2) return { status: 'warning', color: 'yellow' };
    return { status: 'normal', color: 'green' };
  };

  const getSuccessors = (taskName) => {
    return Object.keys(tasks).filter(t => 
      tasks[t].predecessors.includes(taskName)
    );
  };

  const taskEntries = Object.entries(tasks);

  return (
    <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          <TrendingUp className="h-6 w-6 mr-3 text-green-500" />
          Tableau des Tâches
          <Badge variant="secondary" className="ml-3 backdrop-blur-sm">
            {taskEntries.length} tâches
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-white/10">
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Tâche</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Description</TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Durée
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Antécédents</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Successeurs</TableHead>
                {cmpResults.margins && (
                  <>
                    <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Marge</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Statut</TableHead>
                  </>
                )}
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskEntries.map(([taskName, task]) => {
                const taskStatus = getTaskStatus(taskName);
                const successors = getSuccessors(taskName);
                
                return (
                  <TableRow
                    key={taskName}
                    draggable
                    onDragStart={(e) => handleDragStart(e, taskName)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, taskName)}
                    className={`border-white/20 hover:bg-white/10 transition-all duration-200 group cursor-move ${
                      taskStatus.status === 'critical' ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50' : ''
                    } ${draggedTask === taskName ? 'opacity-50 scale-95' : ''}`}
                  >
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-slate-600 transition-colors" />
                    </TableCell>
                    
                    <TableCell>
                      <Badge
                        variant={taskStatus.status === 'critical' ? 'destructive' : 'secondary'}
                        className="font-mono font-bold backdrop-blur-sm"
                      >
                        {taskName}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                      {task.name}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Badge variant="outline" className="backdrop-blur-sm">
                        {task.duration}j
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {task.predecessors.map(pred => (
                          <Badge
                            key={pred}
                            variant="outline"
                            className="text-xs backdrop-blur-sm"
                          >
                            {pred === 'DEB' ? 'DÉBUT' : pred}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {successors.length > 0 ? successors.map(succ => (
                          <Badge
                            key={succ}
                            variant="outline"
                            className="text-xs backdrop-blur-sm"
                          >
                            {succ}
                          </Badge>
                        )) : (
                          <Badge variant="outline" className="text-xs backdrop-blur-sm">
                            FIN
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    {cmpResults.margins && (
                      <>
                        <TableCell className="text-center">
                          <Badge
                            variant={taskStatus.status === 'critical' ? 'destructive' : 'secondary'}
                            className="backdrop-blur-sm"
                          >
                            {cmpResults.margins[taskName]}j
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          {taskStatus.status === 'critical' && (
                            <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                          {taskStatus.status === 'warning' && (
                            <Clock className="h-4 w-4 text-yellow-500 mx-auto" />
                          )}
                          {taskStatus.status === 'normal' && (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          )}
                        </TableCell>
                      </>
                    )}
                    
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTask(taskName)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="backdrop-blur-md bg-white/90 dark:bg-slate-800/90">
                            <DialogHeader>
                              <DialogTitle>Modifier la tâche {taskName}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={editForm.description || ''}
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-duration">Durée (jours)</Label>
                                <Input
                                  id="edit-duration"
                                  type="number"
                                  value={editForm.duration || ''}
                                  onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-predecessors">Antécédents (séparés par des virgules)</Label>
                                <Input
                                  id="edit-predecessors"
                                  value={editForm.predecessors || ''}
                                  onChange={(e) => setEditForm({...editForm, predecessors: e.target.value})}
                                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80"
                                />
                              </div>
                              <Button onClick={handleSaveEdit} className="w-full">
                                Sauvegarder
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(taskName)}
                          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskTable;