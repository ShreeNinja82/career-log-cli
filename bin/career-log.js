#!/usr/bin/env node

/**
 * CLI entry point for career-log-cli
 */

import { runCLI } from '../dist/cli.js';

runCLI(process.argv.slice(2)).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
