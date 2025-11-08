import { Commit } from './git-parser.js';
import { analyzeDiff, DiffAnalysis } from './diff-analyzer.js';

// Legacy function for backward compatibility - now uses diff analyzer
export async function analyzeImpact(
  commit: Commit,
  repoPath: string
): Promise<DiffAnalysis> {
  return await analyzeDiff(commit, repoPath);
}

// Simple synchronous version that returns just the impact level
export function getImpactLevel(commit: Commit): 'high' | 'medium' | 'low' {
  const totalChanges = (commit.insertions || 0) + (commit.deletions || 0);
  const fileCount = commit.files?.length || 0;

  // Quick assessment based on metrics only
  if (totalChanges > 500 || fileCount > 20) {
    return 'high';
  }
  if (totalChanges < 100 && fileCount <= 2) {
    return 'low';
  }
  return 'medium';
}