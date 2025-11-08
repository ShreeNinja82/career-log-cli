import { Command } from 'commander';
import { generateCareerLog } from './lib/generator.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

export async function runCLI(args: string[]) {
  const program = new Command();

  program
    .name('career-log')
    .description('Generate professional career logs from git commits')
    .version(packageJson.version)
    .option('-r, --repo <path>', 'Git repository path')
    .option('-o, --output <file>', 'Output file path', 'career-log.json')
    .option('-l, --limit <number>', 'Maximum commits to process', '100')
    .option('-s, --since <date>', 'Only commits since date (ISO format)')
    .option('-a, --author <email|name>', 'Filter by author')
    .option('--api-key <key>', 'OpenAI API key (enables AI enhancement)')
    .option('--use-local-llm', 'Use local Ollama instance')
    .option('--ollama-model <model>', 'Ollama model name', 'llama3.2')
    .option('--enterprise', 'Enterprise mode (no external APIs, data-local)')
    .option('--skip-low-impact', 'Randomly skip 50% of low-impact commits')
    .option('--confidence-threshold <0-1>', 'Minimum confidence for pattern matching', '0.5')
    .option('--format <json|md|csv>', 'Output format', 'json')
    .option('--skip-pr', 'Skip PR parsing and only use commit messages')
    .option('--github-token <token>', 'GitHub API token for fetching PR details')
    .option('--gitlab-token <token>', 'GitLab API token for fetching PR details')
    .option('--gitlab-url <url>', 'GitLab instance URL (default: https://gitlab.com)')
    .option('-v, --verbose', 'Detailed logging');

  // Check for help or version flags before parsing
  if (args.includes('--help') || args.includes('-h')) {
    program.help();
    return;
  }

  if (args.includes('--version') || args.includes('-V')) {
    console.log(packageJson.version);
    return;
  }

  program.parse(args);

  const options = program.opts();
  
  // Workaround: manually check args for --repo if not parsed
  if (!options.repo) {
    const repoIndex = args.indexOf('--repo');
    if (repoIndex >= 0 && repoIndex + 1 < args.length) {
      options.repo = args[repoIndex + 1];
    } else {
      const repoShortIndex = args.indexOf('-r');
      if (repoShortIndex >= 0 && repoShortIndex + 1 < args.length) {
        options.repo = args[repoShortIndex + 1];
      } else {
        options.repo = process.cwd();
      }
    }
  }

  // Enterprise mode validation
  if (options.enterprise) {
    if (options.apiKey || options.useLocalLlm) {
      console.error('Error: --enterprise mode cannot be used with AI options');
      process.exit(1);
    }
    // Enterprise mode also skips PR parsing (no external APIs)
    options.skipPr = true;
  }

  await generateCareerLog(options);
}
