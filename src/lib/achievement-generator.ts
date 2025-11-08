import { Commit } from './git-parser.js';
import { getImpactLevel } from './impact-analyzer.js';
import { isCommitMessageHelpful, getPRInfo } from './pr-parser.js';

export async function generateAchievement(
  commit: Commit,
  repoPath: string,
  options: {
    apiKey?: string;
    useLocalLlm?: boolean;
    ollamaModel?: string;
    enterprise?: boolean;
    confidenceThreshold?: number;
    skipPR?: boolean;
    githubToken?: string;
    gitlabToken?: string;
    gitlabUrl?: string;
  }
): Promise<string> {
  const impact = getImpactLevel(commit);

  // Check if we should use PR info (when commit message is not helpful and PR exists)
  const usePRInfo = !options.skipPR && !isCommitMessageHelpful(commit.message) && commit.prNumber;
  
  let achievementText = '';
  
  if (usePRInfo) {
    // Use PR title if already fetched
    if (commit.prTitle) {
      achievementText = commit.prTitle;
    } else {
      // Try to fetch PR info if we have tokens
      const prInfo = await getPRInfo(
        commit.message,
        commit.body,
        repoPath,
        {
          skipPR: options.skipPR,
          githubToken: options.githubToken,
          gitlabToken: options.gitlabToken,
          gitlabUrl: options.gitlabUrl,
        }
      );
      
      if (prInfo?.title) {
        achievementText = prInfo.title;
        // Store in commit for future use
        commit.prTitle = prInfo.title;
        commit.prDescription = prInfo.description;
        commit.prUrl = prInfo.url;
      } else if (prInfo?.number) {
        // PR number found but no title - use PR reference
        achievementText = `PR #${prInfo.number}`;
      }
    }
  }
  
  // Fall back to commit message patterns if PR not available or not helpful
  if (!achievementText) {

  // Pattern-based achievement generation (offline)
  const patterns = [
    {
      pattern: /(?:implement|add|create|build)\s+([^,]+)/i,
      template: (match: string) => `Implemented ${match.toLowerCase()}`,
    },
    {
      pattern: /(?:fix|resolve|solve)\s+([^,]+)/i,
      template: (match: string) => `Fixed ${match.toLowerCase()}`,
    },
    {
      pattern: /(?:refactor|restructure|optimize)\s+([^,]+)/i,
      template: (match: string) => `Refactored ${match.toLowerCase()}`,
    },
    {
      pattern: /(?:improve|enhance|upgrade)\s+([^,]+)/i,
      template: (match: string) => `Improved ${match.toLowerCase()}`,
    },
    {
      pattern: /(?:add|integrate|implement)\s+(?:support|feature)\s+for\s+([^,]+)/i,
      template: (match: string) => `Added support for ${match.toLowerCase()}`,
    },
  ];

    // Try to match patterns
    for (const { pattern, template } of patterns) {
      const match = commit.message.match(pattern);
      if (match && match[1]) {
        achievementText = template(match[1].trim());
        break;
      }
    }

    // Fallback: generate based on commit message and impact
    if (!achievementText) {
      const message = commit.message.split('\n')[0]; // First line only
      const fileCount = commit.files?.length || 0;
      const totalChanges = (commit.insertions || 0) + (commit.deletions || 0);

      if (impact === 'high') {
        if (fileCount > 10) {
          achievementText = `Delivered major feature affecting ${fileCount} files`;
        } else if (totalChanges > 200) {
          achievementText = `Implemented significant changes with ${totalChanges} lines modified`;
        } else {
          achievementText = `Completed high-impact work: ${message.substring(0, 60)}`;
        }
      } else if (impact === 'medium') {
        achievementText = `Delivered feature: ${message.substring(0, 60)}`;
      } else {
        achievementText = `Made improvements: ${message.substring(0, 60)}`;
      }
    }
  }
  
  return achievementText || commit.message.substring(0, 60);
}