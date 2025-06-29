import { Command } from 'commander';
import * as path from 'path';
import { StateFileParser } from '../parser.js';
import { CacheManager } from '../cache.js';
import { FileWatcher } from '../watcher.js';
import { VisualizerServer } from '../server.js';

export function createGraphCommand(): Command {
  const command = new Command('graph');
  
  command
    .description('Start the state machine visualizer')
    .argument('[path]', 'Path to search for state files', './src')
    .option('-p, --port <port>', 'Port for the visualizer server', '8080')
    .option('-w, --watch', 'Watch for file changes', true)
    .option('--no-watch', 'Disable file watching')
    .option('--no-server', 'Skip starting the server')
    .action(async (searchPath: string, options) => {
      const absolutePath = path.resolve(searchPath);
      const port = parseInt(options.port);
      
      console.log(`🔍 Searching for state files in: ${absolutePath}`);
      
      const parser = new StateFileParser();
      const cache = new CacheManager(process.cwd());
      
      // Initialize server if not disabled
      let server: VisualizerServer | null = null;
      if (options.server !== false) {
        server = new VisualizerServer(port);
        server.start();
      }
      
      // Update function for both server and cache
      const updateStates = (states: any[]) => {
        if (server) {
          server.updateStates(states);
        }
        console.log(`📊 Updated ${states.length} state machines`);
      };
      
      if (options.watch) {
        // Start file watcher
        const watcher = new FileWatcher(parser, cache, updateStates);
        watcher.start(absolutePath);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log('\\n📋 Shutting down...');
          watcher.stop();
          if (server) {
            server.stop();
          }
          process.exit(0);
        });
        
        console.log(`👀 Watching for changes in *.state.ts files...`);
        console.log('Press Ctrl+C to stop');
        
        // Keep the process running
        await new Promise(() => {});
      } else {
        // One-time scan
        const states = await parser.parseAllStateFiles(absolutePath);
        cache.saveCache(states);
        updateStates(states);
        
        if (server) {
          console.log('Server started. Press Ctrl+C to stop');
          await new Promise(() => {});
        }
      }
    });
  
  return command;
}