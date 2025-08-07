import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Plus, 
  Edit3, 
  Check, 
  X, 
  AlertCircle,
  Calendar,
  Clock,
  Users
} from 'lucide-react';
import { TaskFormData, ValidationError } from '../types';
import { validateTaskData, generateUniqueTaskId } from '../lib/graph-utils';
import { useToast } from '../hooks/use-toast';

interface TaskFormEnhancedProps {
  tasks: Record<string, any>;
  onAddTask: (task: any) => void;
  onUpdateTask?: (taskId: string, task: any) => void;
  editingTask?: { id: string; data: any } | null;
  onCancelEdit?: () => void;
  isCalculating?: boolean;
}

const TaskFormEnhanced: React.FC<TaskFormEnhancedProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  editingTask,
  onCancelEdit,
  isCalculating = false
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    id: '',
    name: '',
    duration: 1,
    predecessors: [],
    description: ''
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [selectedPredecessors, setSelectedPredecessors] = useState<string[]>([]);

  // Initialize form when editing
  useEffect(() => {
    if (editingTask) {
      setFormData({
        id: editingTask.id,
        name: editingTask.data.name || editingTask.id,
        duration: editingTask.data.duration || 1,
        predecessors: editingTask.data.predecessors || [],
        description: editingTask.data.description || ''
      });
      setSelectedPredecessors(editingTask.data.predecessors || []);
      setIsOpen(true);
    }
  }, [editingTask]);

  const resetForm = () => {
    const newId = generateUniqueTaskId(tasks);
    setFormData({
      id: newId,
      name: '',
      duration: 1,
      predecessors: [],
      description: ''
    });
    setSelectedPredecessors([]);
    setErrors([]);
  };

  const validateForm = (): boolean => {
    const validationErrors = validateTaskData(
      { ...formData, predecessors: selectedPredecessors },
      editingTask ? { ...tasks, [editingTask.id]: undefined } : tasks
    );
    
    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire.",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      name: formData.name,
      duration: formData.duration,
      predecessors: selectedPredecessors.length > 0 ? selectedPredecessors : ['DEB'],
      description: formData.description
    };

    try {
      if (editingTask && onUpdateTask) {
        onUpdateTask(editingTask.id, taskData);
        toast({
          title: "Tâche modifiée",
          description: `La tâche "${formData.name}" a été mise à jour avec succès.`,
        });
        onCancelEdit?.();
      } else {
        onAddTask({
          name: formData.id,
          ...taskData
        });
        toast({
          title: "Tâche ajoutée",
          description: `La tâche "${formData.name}" a été ajoutée avec succès.`,
        });
        resetForm();
      }
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (editingTask && onCancelEdit) {
      onCancelEdit();
    }
    setIsOpen(false);
    resetForm();
  };

  const addPredecessor = (predId: string) => {
    if (predId && !selectedPredecessors.includes(predId)) {
      setSelectedPredecessors([...selectedPredecessors, predId]);
    }
  };

  const removePredecessor = (predId: string) => {
    setSelectedPredecessors(selectedPredecessors.filter(p => p !== predId));
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  const availablePredecessors = Object.keys(tasks).filter(taskId => 
    taskId !== formData.id && !selectedPredecessors.includes(taskId)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg"
          disabled={isCalculating}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Tâche
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            {editingTask ? (
              <>
                <Edit3 className="h-5 w-5 mr-3 text-blue-500" />
                Modifier la Tâche {editingTask.id}
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-3 text-green-500" />
                Nouvelle Tâche
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task ID and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskId" className="flex items-center gap-2">
                <Badge variant="outline">ID</Badge>
                Identifiant
              </Label>
              <Input
                id="taskId"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                placeholder="Ex: A, B, C..."
                disabled={!!editingTask}
                className={getFieldError('id') ? 'border-red-500' : ''}
              />
              {getFieldError('id') && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {getFieldError('id')}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskName">Nom de la tâche</Label>
              <Input
                id="taskName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom descriptif de la tâche"
                className={getFieldError('name') ? 'border-red-500' : ''}
              />
              {getFieldError('name') && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {getFieldError('name')}
                </div>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Durée (jours)
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
              className={getFieldError('duration') ? 'border-red-500' : ''}
            />
            {getFieldError('duration') && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                {getFieldError('duration')}
              </div>
            )}
          </div>

          {/* Predecessors */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tâches prédécesseurs
            </Label>
            
            {/* Add predecessor */}
            <div className="flex gap-2">
              <Select onValueChange={addPredecessor}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un prédécesseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEB">DÉBUT (DEB)</SelectItem>
                  {availablePredecessors.map(taskId => (
                    <SelectItem key={taskId} value={taskId}>
                      {taskId} - {tasks[taskId]?.name || 'Sans nom'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected predecessors */}
            <div className="flex flex-wrap gap-2">
              {selectedPredecessors.map(predId => (
                <Badge 
                  key={predId} 
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {predId === 'DEB' ? 'DÉBUT' : predId}
                  <button
                    type="button"
                    onClick={() => removePredecessor(predId)}
                    className="hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            {selectedPredecessors.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Aucun prédécesseur sélectionné (la tâche dépendra du DÉBUT par défaut)
              </div>
            )}
            
            {getFieldError('predecessors') && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                {getFieldError('predecessors')}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée de la tâche..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isCalculating}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {editingTask ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormEnhanced;