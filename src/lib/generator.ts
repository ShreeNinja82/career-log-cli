import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { parseGitCommits } from './git-parser.js';
import { generateAchievement } from './achievement-generator.js';
import { analyzeImpact } from './impact-analyzer.js';
import { formatOutput, CareerLog, CareerLogEntry } from './output-formatter.js';

export async function generateCareerLog(options: any) {
  const spinner = ora('Generating career log...').start();

  try {
    const repoPath = options.repo ? resolve(options.repo) : process.cwd();
    
    // Debug logging
    if (options.verbose) {
      console.log('Repo path resolved to:', repoPath);
      console.log('Options received:', { repo: options.repo, since: options.since });
    }
    
    const outputPath = options.output || 'career-log.json';
    const limit = options.limit ? parseInt(options.limit.toString()) : 100;
    const format = options.format || 'json';
    const skipLowImpact = options.skipLowImpact || false;

    if (options.verbose) {
      spinner.text = `Parsing git commits from ${repoPath}...`;
    }

    // Parse git commits
    const commits = await parseGitCommits(repoPath, {
      limit,
      since: options.since,
      author: options.author,
    });

    if (commits.length === 0) {
      spinner.fail(chalk.red('No commits found'));
      process.exit(1);
    }

    if (options.verbose) {
      spinner.text = `Processing ${commits.length} commits...`;
    }

    // Generate achievements with diff analysis
    const entries: CareerLogEntry[] = [];

    for (const commit of commits) {
      // Analyze diff for impact signals
      const diffAnalysis = await analyzeImpact(commit, repoPath);

      // Skip low impact commits if requested
      if (skipLowImpact && diffAnalysis.impactLevel === 'low' && Math.random() < 0.5) {
        continue;
      }

      const achievementResult = await generateAchievement(commit, repoPath, diffAnalysis, {
        ...options,
        skipPR: options.skipPr,
        githubToken: options.githubToken,
        gitlabToken: options.gitlabToken,
        gitlabUrl: options.gitlabUrl,
      });

      entries.push({
        date: commit.date,
        achievement: achievementResult.achievement,
        confidence: achievementResult.confidence,
        impact: diffAnalysis.impactLevel,
        commit: commit.hash.substring(0, 8),
        filesChanged: commit.files?.length || 0,
        linesChanged: (commit.insertions || 0) + (commit.deletions || 0),
        signals: diffAnalysis.signals,
        fileTypes: diffAnalysis.fileTypes,
        changeMetrics: diffAnalysis.changeMetrics,
      });
    }

    // Create career log
    const careerLog: CareerLog = {
      generatedAt: new Date().toISOString(),
      repository: repoPath,
      totalCommits: commits.length,
      entries: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };

    // Format and write output
    const output = formatOutput(careerLog, format);
    writeFileSync(outputPath, output, 'utf-8');

    spinner.succeed(chalk.green('Career log generation complete!'));
    console.log(chalk.blue(`Output: ${outputPath}`));
    console.log(chalk.gray(`Processed ${commits.length} commits, generated ${entries.length} entries`));
  } catch (error: any) {
    spinner.fail(chalk.red('Failed to generate career log'));
    console.error(chalk.red(error.message));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}