import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { createRequire } from "module";
import type { StateFileInfo } from "./types.js";

const require = createRequire(import.meta.url);

export class StateFileParser {
  async findStateFiles(searchPath: string): Promise<string[]> {
    const pattern = path.join(searchPath, "**/*.state.ts");
    const files = await glob(pattern, {
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    });
    return files;
  }

  async parseStateFile(filePath: string): Promise<StateFileInfo | null> {
    try {
      // Read the file content
      const content = fs.readFileSync(filePath, "utf-8");

      // Extract machine name from filename or content
      const fileName = path.basename(filePath, ".state.ts");
      const machineName = this.extractMachineName(content, fileName);

      // Try to compile and execute the TypeScript file
      const compiledContent = await this.compileTypeScript(content, filePath);
      const machineInstance = await this.extractMachine(
        compiledContent,
        filePath
      );

      if (!machineInstance) {
        console.warn(`No machine found in ${filePath}`);
        return null;
      }

      // Convert to XState JSON
      const xstateJson = machineInstance.toXStateJSON();

      return {
        filePath,
        machineName,
        xstateJson,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Failed to parse state file ${filePath}:`, error);
      return null;
    }
  }

  private extractMachineName(content: string, fallbackName: string): string {
    // Try to find machine name from createMachine call
    const reg = /createMachine\\s*\\(\\s*[\"']([^\"']+)[\"'])/;
    const machineNameMatch = content.match(reg);
    if (machineNameMatch) {
      return machineNameMatch[1];
    }

    // Try to find exported machine variable name
    const exportMatch = content.match(
      /export\\s+(?:const|let|var)\\s+(\\w+)\\s*=/
    );
    if (exportMatch) {
      return exportMatch[1];
    }

    return fallbackName;
  }

  private async compileTypeScript(
    content: string,
    filePath: string
  ): Promise<string> {
    // For now, we'll use a simple approach - try to import the file directly
    // In production, you might want to use ts-node or compile to temp file
    return content;
  }

  private async extractMachine(
    content: string,
    filePath: string
  ): Promise<any> {
    try {
      // Create a temporary file to evaluate
      const tempFile = filePath.replace(".state.ts", ".temp.mjs");

      // Convert TypeScript imports to Node.js compatible format
      let processedContent = content
        .replace(
          /import\\s+{([^}]+)}\\s+from\\s+[\"']elevo[\"']/g,
          'import { $1 } from "elevo"'
        )
        .replace(
          /import\\s+{([^}]+)}\\s+from\\s+[\"']elevo-react[\"']/g,
          'import { $1 } from "elevo-react"'
        );

      // Add export to make it importable
      if (!content.includes("export")) {
        // Try to find the machine variable and export it
        const machineMatch = content.match(
          /(const|let|var)\\s+(\\w+)\\s*=\\s*createMachine/
        );
        if (machineMatch) {
          processedContent += `\\nexport { ${machineMatch[2]} as default };`;
        }
      }

      fs.writeFileSync(tempFile, processedContent);

      try {
        const module = await import(`file://${tempFile}`);
        const machine =
          module.default ||
          Object.values(module).find(
            (exp: any) =>
              exp &&
              typeof exp === "object" &&
              typeof exp.toXStateJSON === "function"
          );

        return machine;
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    } catch (error) {
      console.error(`Failed to extract machine from ${filePath}:`, error);
      return null;
    }
  }

  async parseAllStateFiles(searchPath: string): Promise<StateFileInfo[]> {
    const files = await this.findStateFiles(searchPath);
    const results: StateFileInfo[] = [];

    console.log(`Found ${files.length} state files`);

    for (const file of files) {
      console.log(`Parsing ${file}...`);
      const parsed = await this.parseStateFile(file);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }
}
