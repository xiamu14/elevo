import * as fs from "fs";
import * as path from "path";
import type { CacheEntry, StateFileInfo } from "./types.js";

export class CacheManager {
  private cacheDir: string;

  constructor(projectRoot: string) {
    this.cacheDir = path.join(projectRoot, "node_modules", "elevo", ".cache");
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  saveCache(states: StateFileInfo[]): string {
    const timestamp = Date.now();
    const cacheEntry: CacheEntry = {
      timestamp,
      states,
    };

    // Also save as latest.json for easy access
    const latestPath = path.join(this.cacheDir, "latest.json");

    fs.writeFileSync(latestPath, JSON.stringify(cacheEntry, null, 2));

    return latestPath;
  }

  output(states: StateFileInfo[]) {
    const files: string[] = [];
    states.forEach((state) => {
      const statelyPath = path.join(
        this.cacheDir,
        `stately-${state.machineName}.js`
      );
      files.push(statelyPath);
      fs.writeFileSync(
        statelyPath,
        `import { createMachine } from "xstate";

export const machine = createMachine(${JSON.stringify(
          state.xstateJson,
          null,
          2
        )})`
      );
    });
    return files;
  }

  getLatestCache(): CacheEntry | null {
    const latestPath = path.join(this.cacheDir, "latest.json");

    if (!fs.existsSync(latestPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(latestPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.warn("Failed to read latest cache:", error);
      return null;
    }
  }

  getCacheHistory(): CacheEntry[] {
    const files = fs
      .readdirSync(this.cacheDir)
      .filter((file) => file.endsWith(".json") && file !== "latest.json")
      .sort((a, b) => {
        const aTime = parseInt(a.replace(".json", ""));
        const bTime = parseInt(b.replace(".json", ""));
        return bTime - aTime; // newest first
      });

    const history: CacheEntry[] = [];

    for (const file of files.slice(0, 10)) {
      // Keep last 10 entries
      try {
        const content = fs.readFileSync(
          path.join(this.cacheDir, file),
          "utf-8"
        );
        history.push(JSON.parse(content));
      } catch (error) {
        console.warn(`Failed to read cache file ${file}:`, error);
      }
    }

    return history;
  }

  cleanOldCache(keepCount: number = 10): void {
    const files = fs
      .readdirSync(this.cacheDir)
      .filter((file) => file.endsWith(".json") && file !== "latest.json")
      .sort((a, b) => {
        const aTime = parseInt(a.replace(".json", ""));
        const bTime = parseInt(b.replace(".json", ""));
        return bTime - aTime;
      });

    const filesToDelete = files.slice(keepCount);

    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(path.join(this.cacheDir, file));
      } catch (error) {
        console.warn(`Failed to delete old cache file ${file}:`, error);
      }
    }
  }
}
