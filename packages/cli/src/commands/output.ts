import { Command } from "commander";
import * as path from "path";
import { StateFileParser } from "../parser.js";
import { CacheManager } from "../cache.js";

export function createOutputCommand(): Command {
  const command = new Command("output");

  command
    .description("Output all state files")
    .argument("[path]", "Path to search for state files", "./src")

    .action(async (searchPath: string, options) => {
      const absolutePath = path.resolve(searchPath);

      console.log(`🔍 Searching for state files in: ${absolutePath}`);

      const parser = new StateFileParser();
      const cache = new CacheManager(process.cwd());

      // One-time scan
      const states = await parser.parseAllStateFiles(absolutePath);
      const file = cache.output(states);
      console.log("[file]", file);
    });

  return command;
}
