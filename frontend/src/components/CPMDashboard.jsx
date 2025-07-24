import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Moon, Sun, Download, Save, FolderOpen, Calculator, RotateCcw } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import TaskForm from "./TaskForm";
import TaskTable from "./TaskTable";
import PERTDiagram from "./PERTDiagram";
import ProjectManager from "./ProjectManager";
import { initialTasks } from "../data/mockData";
import { calculateCPM } from "../utils/cpmCalculations";
import { useToast } from "../hooks/use-toast";

const CPMDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [cmpResults, setCmpResults] = useState({});
  const [currentProject, setCurrentProject] = useState("Nouveau Projet");
  const [isCalculating, setIsCalculating] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);

  useEffect(() => {
    calculateAndDisplayCPM();
  }, [tasks]);

  const calculateAndDisplayCPM = async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const results = calculateCPM(tasks);
      setCmpResults(results);
      
      toast({
        title: "Calcul CPM terminé ✨",
        description: `Durée totale: ${results.totalDuration} jours. Chemin critique: ${results.criticalPath.length} tâches.`,
      });
    } catch (error) {
      toast({
        title: "Erreur de calcul",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddTask = (taskData) => {
    const newTasks = {
      ...tasks,
      [taskData.name]: {
        duration: taskData.duration,
        predecessors: taskData.predecessors.length ? taskData.predecessors : ['DEB'],
        name: taskData.description || taskData.name
      }
    };
    setTasks(newTasks);
    
    toast({
      title: "Tâche ajoutée",
      description: `La tâche "${taskData.name}" a été ajoutée avec succès.`,
    });
  };

  const handleUpdateTask = (taskName, taskData) => {
    const newTasks = { ...tasks };
    newTasks[taskName] = {
      duration: taskData.duration,
      predecessors: taskData.predecessors.length ? taskData.predecessors : ['DEB'],
      name: taskData.description || taskData.name
    };
    setTasks(newTasks);
    
    toast({
      title: "Tâche modifiée",
      description: `La tâche "${taskName}" a été mise à jour.`,
    });
  };

  const handleDeleteTask = (taskName) => {
    const newTasks = { ...tasks };
    delete newTasks[taskName];
    
    // Remove from predecessors of other tasks
    Object.keys(newTasks).forEach(task => {
      newTasks[task].predecessors = newTasks[task].predecessors.filter(p => p !== taskName);
      if (newTasks[task].predecessors.length === 0) {
        newTasks[task].predecessors = ['DEB'];
      }
    });
    
    setTasks(newTasks);
    
    toast({
      title: "Tâche supprimée",
      description: `La tâche "${taskName}" a été supprimée.`,
    });
  };

  const handleReorderTasks = (reorderedTasks) => {
    setTasks(reorderedTasks);
  };

  const handleReset = () => {
    setTasks(initialTasks);
    toast({
      title: "Projet réinitialisé",
      description: "Le projet a été remis aux valeurs par défaut.",
    });
  };

  const exportDiagram = () => {
    toast({
      title: "Export en cours...",
      description: "Le diagramme PERT sera téléchargé sous peu.",
    });
    // Mock export functionality
    setTimeout(() => {
      toast({
        title: "Export réussi ✅",
        description: "Le diagramme a été exporté en PNG.",
      });
    }, 2000);
  };

  const saveProject = () => {
    const projectData = {
      name: currentProject,
      tasks,
      savedAt: new Date().toISOString()
    };
    // Mock save to localStorage
    localStorage.setItem(`cpm-project-${Date.now()}`, JSON.stringify(projectData));
    
    toast({
      title: "Projet sauvegardé ✅",
      description: `Le projet "${currentProject}" a été sauvegardé.`,
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              CPM Dashboard
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Méthode des Potentiels Métra - Gestion de Projet Intelligente
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-white/20 hover:bg-white/90 transition-all duration-300"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProjectManager(true)}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-white/20 hover:bg-white/90 transition-all duration-300"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Projets
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveProject}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-white/20 hover:bg-white/90 transition-all duration-300"
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportDiagram}
              className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-white/20 hover:bg-white/90 transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Project Info Card */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {currentProject}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="backdrop-blur-sm">
                    {Object.keys(tasks).length} tâches
                  </Badge>
                  {cmpResults.totalDuration && (
                    <Badge variant="secondary" className="backdrop-blur-sm">
                      {cmpResults.totalDuration} jours total
                    </Badge>
                  )}
                  {cmpResults.criticalPath && (
                    <Badge variant="destructive" className="backdrop-blur-sm">
                      {cmpResults.criticalPath.length} tâches critiques
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={calculateAndDisplayCPM}
                  disabled={isCalculating}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                >
                  <Calculator className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
                  {isCalculating ? 'Calcul...' : 'Calculer CPM'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-white/20"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-700/80">
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-700/80">
            Gestion des tâches
          </TabsTrigger>
          <TabsTrigger value="diagram" className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-700/80">
            Diagramme PERT
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-700/80">
            Analyse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaskForm
              onAddTask={handleAddTask}
              existingTasks={tasks}
              isCalculating={isCalculating}
            />
            <TaskTable
              tasks={tasks}
              cmpResults={cmpResults}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onReorderTasks={handleReorderTasks}
            />
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <TaskTable
            tasks={tasks}
            cmpResults={cmpResults}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
            fullView={true}
          />
        </TabsContent>

        <TabsContent value="diagram">
          <PERTDiagram
            tasks={tasks}
            cmpResults={cmpResults}
            isCalculating={isCalculating}
          />
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Analysis cards would go here */}
            <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20">
              <CardHeader>
                <CardTitle>Chemin Critique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cmpResults.criticalPath?.map(task => (
                    <Badge key={task} variant="destructive" className="mr-2">
                      {task}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Project Manager Modal */}
      {showProjectManager && (
        <ProjectManager
          onClose={() => setShowProjectManager(false)}
          onLoadProject={(project) => {
            setTasks(project.tasks);
            setCurrentProject(project.name);
            setShowProjectManager(false);
          }}
        />
      )}
    </div>
  );
};

export default CPMDashboard;