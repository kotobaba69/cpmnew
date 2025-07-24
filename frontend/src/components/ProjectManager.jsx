import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trash2, Download, Calendar, Clock, FolderOpen } from "lucide-react";
import { savedProjects } from "../data/mockData";
import { useToast } from "../hooks/use-toast";

const ProjectManager = ({ onClose, onLoadProject }) => {
  const { toast } = useToast();
  const [projects, setProjects] = useState(savedProjects);
  const [newProjectName, setNewProjectName] = useState("");

  const handleLoadProject = (project) => {
    onLoadProject(project);
    toast({
      title: "Projet chargé ✅",
      description: `Le projet "${project.name}" a été chargé avec succès.`,
    });
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès.",
      });
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: Date.now().toString(),
      name: newProjectName,
      tasks: {},
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    setProjects(prev => [newProject, ...prev]);
    setNewProjectName("");
    
    toast({
      title: "Nouveau projet créé ✨",
      description: `Le projet "${newProjectName}" a été créé.`,
    });
  };

  const exportProject = (project) => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_CPM.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export réussi ✅",
      description: `Le projet "${project.name}" a été exporté.`,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl backdrop-blur-md bg-white/90 dark:bg-slate-800/90 border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <FolderOpen className="h-6 w-6 mr-3 text-blue-500" />
            Gestionnaire de Projets
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new project */}
          <Card className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border-white/20">
            <CardHeader>
              <CardTitle className="text-lg">Nouveau Projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Nom du projet..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 border-white/30"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  Créer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Projects list */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {projects.map(project => (
              <Card
                key={project.id}
                className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border-white/20 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300 group"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">
                        {project.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="backdrop-blur-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          {Object.keys(project.tasks).length} tâches
                        </Badge>
                        <Badge variant="outline" className="backdrop-blur-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          Créé le {project.createdAt}
                        </Badge>
                        <Badge variant="outline" className="backdrop-blur-sm">
                          Modifié le {project.lastModified}
                        </Badge>
                      </div>
                      
                      {/* Task preview */}
                      {Object.keys(project.tasks).length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Tâches: </span>
                          {Object.keys(project.tasks).slice(0, 5).join(", ")}
                          {Object.keys(project.tasks).length > 5 && "..."}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => handleLoadProject(project)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-sm"
                        size="sm"
                      >
                        Charger
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportProject(project)}
                          className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 p-2"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="backdrop-blur-sm bg-white/80 dark:bg-slate-700/80 p-2 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun projet sauvegardé</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectManager;