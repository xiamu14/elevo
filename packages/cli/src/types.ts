export interface StateFileInfo {
  filePath: string;
  machineName: string;
  xstateJson: any;
  timestamp: number;
}

export interface CacheEntry {
  timestamp: number;
  states: StateFileInfo[];
}

export interface VisualizerMessage {
  type: 'state_update' | 'initial_data' | 'error';
  data: StateFileInfo[] | string;
  token: string;
  timestamp: number;
}

export interface CLIConfig {
  port: number;
  cacheDir: string;
  watchPattern: string;
  token: string;
}