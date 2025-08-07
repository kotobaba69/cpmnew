export interface Task {
  id: string;
  name: string;
  duration: number;
  predecessors: string[];
  description?: string;
}

export interface CPMNode {
  id: string;
  est: number; // Earliest Start Time
  eft: number; // Earliest Finish Time
  lst: number; // Latest Start Time
  lft: number; // Latest Finish Time
  slack: number; // Total Float/Slack
  isCritical: boolean;
}

export interface CPMResults {
  nodes: Map<string, CPMNode>;
  criticalPath: string[];
  totalDuration: number;
  projectStats: {
    totalTasks: number;
    criticalTasks: number;
    averageSlack: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    task: Task;
    cmpNode?: CPMNode;
    onEdit?: (taskId: string) => void;
  };
  style?: {
    width?: number;
    height?: number;
    borderRadius?: string;
    fontSize?: string;
    border?: string;
    backgroundColor?: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
  animated?: boolean;
}

export interface TaskFormData {
  id: string;
  name: string;
  duration: number;
  predecessors: string[];
  description?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ProjectData {
  name: string;
  tasks: Task[];
  createdAt: string;
  lastModified: string;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeStats: boolean;
  includeCriticalPath: boolean;
}