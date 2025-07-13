export interface StateFileInfo {
  filePath: string;
  machineName: string;
  xstateJson: XStateConfig;
  timestamp: number;
}

export interface XStateConfig {
  id: string;
  initial: string;
  states: Record<
    string,
    {
      on?: Record<string, string | { target: string; actions?: string[] }>;
    }
  >;
}

export interface VisualizerMessage {
  type: "state_update" | "initial_data" | "error";
  data: StateFileInfo[] | string;
  token: string;
  timestamp: number;
}

export interface GraphNode {
  id: string;
  type: "state";
  data: {
    label: string;
    isInitial: boolean;
    transitions: string[];
  };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type?: string;
}
