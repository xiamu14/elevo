import chokidar from 'chokidar';
import * as path from 'path';
import type { StateFileInfo } from './types.js';
import { StateFileParser } from './parser.js';
import { CacheManager } from './cache.js';

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private parser: StateFileParser;
  private cache: CacheManager;
  private onUpdate: (states: StateFileInfo[]) => void;
  private currentStates: Map<string, StateFileInfo> = new Map();

  constructor(
    parser: StateFileParser,
    cache: CacheManager,
    onUpdate: (states: StateFileInfo[]) => void
  ) {
    this.parser = parser;
    this.cache = cache;
    this.onUpdate = onUpdate;
  }

  start(watchPath: string): void {
    const pattern = path.join(watchPath, '**/*.state.ts');
    
    console.log(`Starting file watcher for: ${pattern}`);
    
    this.watcher = chokidar.watch(pattern, {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      persistent: true,
      ignoreInitial: false
    });

    // Handle file events
    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
      .on('unlink', (filePath) => this.handleFileRemove(filePath))
      .on('error', (error) => console.error('File watcher error:', error))
      .on('ready', () => {
        console.log('File watcher is ready');
        this.initialScan(watchPath);
      });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('File watcher stopped');
    }
  }

  private async initialScan(watchPath: string): Promise<void> {
    console.log('Performing initial scan...');
    const states = await this.parser.parseAllStateFiles(watchPath);
    
    this.currentStates.clear();
    states.forEach(state => {
      this.currentStates.set(state.filePath, state);
    });
    
    if (states.length > 0) {
      this.cache.saveCache(states);
      this.onUpdate(states);
      console.log(`Initial scan complete: found ${states.length} state machines`);
    }
  }

  private async handleFileChange(filePath: string, changeType: 'added' | 'changed'): Promise<void> {
    console.log(`File ${changeType}: ${filePath}`);
    
    try {
      const parsed = await this.parser.parseStateFile(filePath);
      
      if (parsed) {
        this.currentStates.set(filePath, parsed);
        console.log(`Successfully parsed: ${parsed.machineName}`);
      } else {
        this.currentStates.delete(filePath);
        console.log(`Failed to parse or removed: ${filePath}`);
      }
      
      const allStates = Array.from(this.currentStates.values());
      this.cache.saveCache(allStates);
      this.onUpdate(allStates);
      
    } catch (error) {
      console.error(`Error handling file change for ${filePath}:`, error);
    }
  }

  private handleFileRemove(filePath: string): void {
    console.log(`File removed: ${filePath}`);
    
    this.currentStates.delete(filePath);
    
    const allStates = Array.from(this.currentStates.values());
    this.cache.saveCache(allStates);
    this.onUpdate(allStates);
  }

  getCurrentStates(): StateFileInfo[] {
    return Array.from(this.currentStates.values());
  }
}