#!/usr/bin/env node
import { Command } from "commander";
import { createGraphCommand } from "./commands/graph.js";
import { createOutputCommand } from "./commands/output.js";

const program = new Command();

program
  .name("elevo")
  .description("Elevo CLI - State machine visualization and development tools")
  .version("0.1.0");

// Add commands
program.addCommand(createGraphCommand());
program.addCommand(createOutputCommand());

// Parse command line arguments
program.parse(process.argv);
