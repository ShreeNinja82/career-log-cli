import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { parseGitCommits } from './git-parser.js';
import { generateAchievement } from './achievement-generator.js';
import { analyzeImpact } from './impact-analyzer.js';
import { formatOutput, CareerLog, CareerLogEntry } from './output-formatter.js';

export async function generateCareerLog(options: any) {
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

    // Step 1: Extract commits
    console.log('Extracting commits from repository...');
    const spinner1 = ora().start();
    const commits = await parseGitCommits(repoPath, {
      limit,
      since: options.since,
      author: options.author,
    });

    if (commits.length === 0) {
      spinner1.stop();
      console.error(chalk.red('No commits found'));
      process.exit(1);
    }

    spinner1.stop();

    // Step 2: Analyze impact signals
    console.log('Analyzing impact signals...');
    const spinner2 = ora().start();
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
        aiGenerated: achievementResult.aiGenerated,
        dataLocal: achievementResult.dataLocal,
        impact: diffAnalysis.impactLevel,
        commit: commit.hash.substring(0, 8),
        filesChanged: commit.files?.length || 0,
        linesChanged: (commit.insertions || 0) + (commit.deletions || 0),
        signals: diffAnalysis.signals,
        fileTypes: diffAnalysis.fileTypes,
        changeMetrics: diffAnalysis.changeMetrics,
      });
    }

    spinner2.stop();

    // Step 3: Generate achievements
    console.log('Generating achievements...');
    const spinner3 = ora().start();
    
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

    spinner3.stop();

    // Calculate impact counts from generated entries
    const impactCounts = {
      high: entries.filter(e => e.impact === 'high').length,
      medium: entries.filter(e => e.impact === 'medium').length,
      low: entries.filter(e => e.impact === 'low').length,
    };

    // Display summary
    console.log('');
    console.log(chalk.green('✓') + ' ' + chalk.bold(`Generated ${entries.length} achievement${entries.length !== 1 ? 's' : ''}`));
    console.log(chalk.green('✓') + ' ' + chalk.bold(`High-impact: ${impactCounts.high} achievement${impactCounts.high !== 1 ? 's' : ''}`));
    console.log(chalk.green('✓') + ' ' + chalk.bold(`Medium-impact: ${impactCounts.medium} achievement${impactCounts.medium !== 1 ? 's' : ''}`));
    console.log(chalk.green('✓') + ' ' + chalk.bold(`Saved to ${outputPath}`));
  } catch (error: any) {
    console.error('');
    console.error(chalk.red('✗ Failed to generate career log'));
    console.error(chalk.red(error.message));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}