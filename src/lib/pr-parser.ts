export interface PRInfo {
  number: number;
  title?: string;
  description?: string;
  url?: string;
}

// Patterns to detect PR references in commit messages
const PR_PATTERNS = [
  /(?:fixes?|closes?|resolves?|merges?)\s+(?:#|PR\s*#?)(\d+)/i,
  /(?:#|PR\s*#?)(\d+)/i,
  /PR[:\s]+(\d+)/i,
  /pull[-\s]?request[:\s]+#?(\d+)/i,
];

/**
 * Extract PR number from commit message
 */
export function extractPRNumber(commitMessage: string, commitBody?: string): number | null {
  const combined = `${commitMessage} ${commitBody || ''}`;
  
  for (const pattern of PR_PATTERNS) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return null;
}

/**
 * Check if commit message is "not helpful" (too generic or short)
 */
export function isCommitMessageHelpful(message: string): boolean {
  const trimmed = message.trim();
  
  // Too short
  if (trimmed.length < 10) {
    return false;
  }
  
  // Generic messages
  const genericPatterns = [
    /^update$/i,
    /^fix$/i,
    /^changes?$/i,
    /^wip$/i,
    /^work in progress$/i,
    /^merge$/i,
    /^update \.\.\.$/i,
    /^bump$/i,
    /^merge branch/i,
    /^merge pull request/i,
  ];
  
  if (genericPatterns.some(pattern => pattern.test(trimmed))) {
    return false;
  }
  
  return true;
}

/**
 * Fetch PR details from GitHub API
 */
export async function fetchPRFromGitHub(
  owner: string,
  repo: string,
  prNumber: number,
  apiKey?: string
): Promise<PRInfo | null> {
  if (!apiKey) {
    return null;
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${apiKey}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'career-log-cli',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as any;
    return {
      number: prNumber,
      title: data.title,
      description: data.body || undefined,
      url: data.html_url,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Fetch PR details from GitLab API
 */
export async function fetchPRFromGitLab(
  projectPath: string,
  prNumber: number,
  apiKey?: string,
  gitlabUrl: string = 'https://gitlab.com'
): Promise<PRInfo | null> {
  if (!apiKey) {
    return null;
  }

  try {
    const url = `${gitlabUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/merge_requests/${prNumber}`;
    const response = await fetch(url, {
      headers: {
        'PRIVATE-TOKEN': apiKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as any;
    return {
      number: prNumber,
      title: data.title,
      description: data.description || undefined,
      url: data.web_url,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Detect repository platform and extract owner/repo
 */
export async function detectRepoInfo(repoPath: string): Promise<{
  platform: 'github' | 'gitlab' | 'unknown';
  owner?: string;
  repo?: string;
  projectPath?: string;
}> {
  // Try to get remote URL
  try {
    const { execSync } = await import('child_process');
    const remoteUrl = execSync('git config --get remote.origin.url', {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();

    // GitHub patterns
    const githubMatch = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (githubMatch) {
      return {
        platform: 'github',
        owner: githubMatch[1],
        repo: githubMatch[2].replace(/\.git$/, ''),
      };
    }

    // GitLab patterns
    const gitlabMatch = remoteUrl.match(/gitlab\.com[/:](.+?)(?:\.git)?$/i);
    if (gitlabMatch) {
      return {
        platform: 'gitlab',
        projectPath: gitlabMatch[1].replace(/\.git$/, ''),
      };
    }

    // Custom GitLab instances
    const customGitlabMatch = remoteUrl.match(/([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (customGitlabMatch && !remoteUrl.includes('github.com')) {
      // Try to extract from common GitLab patterns
      const pathMatch = remoteUrl.match(/(?:git@|https?:\/\/)([^:]+)[/:](.+?)(?:\.git)?$/i);
      if (pathMatch) {
        return {
          platform: 'gitlab',
          projectPath: pathMatch[2],
        };
      }
    }
  } catch (error) {
    // Could not detect
  }

  return { platform: 'unknown' };
}

/**
 * Get PR info for a commit
 */
export async function getPRInfo(
  commitMessage: string,
  commitBody: string | undefined,
  repoPath: string,
  options: {
    skipPR?: boolean;
    githubToken?: string;
    gitlabToken?: string;
    gitlabUrl?: string;
  }
): Promise<PRInfo | null> {
  if (options.skipPR) {
    return null;
  }

  const prNumber = extractPRNumber(commitMessage, commitBody);
  
  if (!prNumber) {
    return null;
  }

  // Try to fetch from API if tokens are provided
  const repoInfo = await detectRepoInfo(repoPath);
  
  if (repoInfo.platform === 'github' && repoInfo.owner && repoInfo.repo && options.githubToken) {
    const prInfo = await fetchPRFromGitHub(
      repoInfo.owner,
      repoInfo.repo,
      prNumber,
      options.githubToken
    );
    if (prInfo) {
      return prInfo;
    }
  }
  
  if (repoInfo.platform === 'gitlab' && repoInfo.projectPath && options.gitlabToken) {
    const prInfo = await fetchPRFromGitLab(
      repoInfo.projectPath,
      prNumber,
      options.gitlabToken,
      options.gitlabUrl
    );
    if (prInfo) {
      return prInfo;
    }
  }

  // Return basic PR info even without API access
  return {
    number: prNumber,
  };
}
