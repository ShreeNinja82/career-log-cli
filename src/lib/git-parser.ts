import simpleGit, { SimpleGit, LogResult } from 'simple-git';
import { extractPRNumber } from './pr-parser.js';

export interface Commit {
  hash: string;
  date: string;
  message: string;
  author: string;
  body?: string;
  files?: string[];
  insertions?: number;
  deletions?: number;
  prNumber?: number;
  prTitle?: string;
  prDescription?: string;
  prUrl?: string;
}

export async function parseGitCommits(
  repoPath: string,
  options: {
    limit?: number;
    since?: string;
    author?: string;
  }
): Promise<Commit[]> {
  const git: SimpleGit = simpleGit(repoPath);

  try {
    const logOptions: any = {
      maxCount: options.limit ? parseInt(options.limit.toString()) : 100,
      format: {
        hash: '%H',
        date: '%ai',
        message: '%s',
        author: '%an <%ae>',
        body: '%b',
      },
    };

    if (options.author) {
      logOptions.author = options.author;
    }

    const log: LogResult = await git.log(logOptions);

    let commits: Commit[] = log.all.map((commit) => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name,
      body: commit.body || undefined,
    }));

    // Filter by date if since option is provided
    if (options.since) {
      const sinceDate = new Date(options.since);
      commits = commits.filter((commit) => {
        const commitDate = new Date(commit.date);
        return commitDate >= sinceDate;
      });
    }

    // Get file stats and extract PR numbers for each commit
    for (const commit of commits) {
      try {
        const diffSummary = await git.diffSummary([`${commit.hash}^`, commit.hash]);
        commit.files = diffSummary.files.map((f) => f.file);
        commit.insertions = diffSummary.insertions;
        commit.deletions = diffSummary.deletions;
      } catch (error) {
        // Skip if diff fails (e.g., first commit)
      }

      // Extract PR number from commit message
      const prNumber = extractPRNumber(commit.message, commit.body);
      if (prNumber) {
        commit.prNumber = prNumber;
      }
    }

    return commits;
  } catch (error: any) {
    throw new Error(`Failed to parse git commits: ${error.message}`);
  }
}