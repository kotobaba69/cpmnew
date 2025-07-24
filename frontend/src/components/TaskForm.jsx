import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Plus, X, Sparkles } from "lucide-react";
import { validateTask } from "../utils/cpmCalculations";
import { useToast } from "../hooks/use-toast";

const TaskForm = ({ onAddTask, existingTasks, isCalculating }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 1,
    predecessors: []
  });
  const [selectedPredecessor, setSelectedPredecessor] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPredecessor = (predecessor) => {
    if (predecessor && !formData.predecessors.includes(predecessor)) {
      setFormData(prev => ({
        ...prev,
        predecessors: [...prev.predecessors, predecessor]
      }));
      setSelectedPredecessor("");
    }
  };

  const removePredecessor = (predecessor) => {
    setFormData(prev => ({
      ...prev,
      predecessors: prev.predecessors.filter(p => p !== predecessor)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateTask(
      formData.name,
      formData.duration,
      formData.predecessors,
      existingTasks
    );

    if (errors.length > 0) {
      toast({
        title: "Erreurs de validation",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsAnimating(true);
    
    // Animation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onAddTask({
      name: formData.name.toUpperCase(),
      description: formData.description || formData.name,
      duration: parseInt(formData.duration),
      predecessors: formData.predecessors
    });

    // Reset form
    setFormData({
      name: "",
      description: "",
      duration: 1,
      predecessors: []
    });
    
    setIsAnimating(false);
  };

  const availablePredecessors = ['DEB', ...Object.keys(existingTasks)];

  return (
    <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
      <CardHeader className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          <Sparkles className="h-6 w-6 mr-3 text-blue-500 animate-pulse" />
          Nouvelle Tâche
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name */}
          <div className="space-y-2 group/field">
            <Label htmlFor="taskName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nom de la tâche *
            </Label>
            <Input
              id="taskName"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: TACHE_A"
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 border-white/30 focus:border-blue-400 transition-all duration-300 group-hover/field:border-blue-300"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2 group/field">
            <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Description détaillée de la tâche..."
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 border-white/30 focus:border-blue-400 transition-all duration-300 group-hover/field:border-blue-300 resize-none"
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2 group/field">
            <Label htmlFor="duration" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Durée (jours) *
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 border-white/30 focus:border-blue-400 transition-all duration-300 group-hover/field:border-blue-300"
              required
            />
          </div>

          {/* Predecessors */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Antécédents
            </Label>
            
            <div className="flex gap-2">
              <Select value={selectedPredecessor} onValueChange={setSelectedPredecessor}>
                <SelectTrigger className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 border-white/30 focus:border-blue-400 transition-all duration-300">
                  <SelectValue placeholder="Sélectionner un antécédent..." />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md bg-white/90 dark:bg-slate-800/90">
                  {availablePredecessors
                    .filter(pred => !formData.predecessors.includes(pred))
                    .map(pred => (
                      <SelectItem key={pred} value={pred}>
                        {pred === 'DEB' ? 'DÉBUT' : `${pred} - ${existingTasks[pred]?.name || pred}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addPredecessor(selectedPredecessor)}
                disabled={!selectedPredecessor}
                className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 border-white/30 hover:bg-white/90 transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Predecessors */}
            {formData.predecessors.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg backdrop-blur-sm bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/30">
                {formData.predecessors.map(pred => (
                  <Badge
                    key={pred}
                    variant="secondary"
                    className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 cursor-pointer group/badge"
                    onClick={() => removePredecessor(pred)}
                  >
                    {pred === 'DEB' ? 'DÉBUT' : pred}
                    <X className="h-3 w-3 ml-1 group-hover/badge:text-red-500 transition-colors" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isCalculating || isAnimating}
            className={`w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold py-3 transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] ${
              isAnimating ? 'animate-pulse scale-105' : ''
            }`}
          >
            <Plus className={`h-5 w-5 mr-2 ${isAnimating ? 'animate-spin' : ''}`} />
            {isAnimating ? 'Ajout en cours...' : 'Ajouter la tâche'}
          </Button>
        </form>

        {/* Helper Text */}
        <div className="text-xs text-muted-foreground bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 p-3 rounded-lg backdrop-blur-sm border border-white/20">
          💡 <strong>Astuce :</strong> Laissez les antécédents vides pour une tâche de départ, ou sélectionnez "DÉBUT" pour commencer au début du projet.
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskForm;