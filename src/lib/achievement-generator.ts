import { Commit } from './git-parser.js';
import { DiffAnalysis } from './diff-analyzer.js';
import { isCommitMessageHelpful, getPRInfo } from './pr-parser.js';
import simpleGit, { SimpleGit } from 'simple-git';

export interface AchievementResult {
  achievement: string;
  confidence: number;
}

// Component detection patterns
const COMPONENT_PATTERNS: Record<string, RegExp[]> = {
  auth: [/auth/i, /authentication/i, /login/i, /session/i, /jwt/i, /oauth/i, /token/i],
  API: [/api/i, /endpoint/i, /route/i, /controller/i, /handler/i],
  database: [/database/i, /db/i, /sql/i, /query/i, /migration/i, /schema/i, /model/i],
  UI: [/ui/i, /component/i, /view/i, /page/i, /screen/i, /\.tsx$/i, /\.jsx$/i, /\.vue$/i],
  frontend: [/frontend/i, /client/i, /\.html$/i, /\.css$/i, /\.scss$/i],
  backend: [/backend/i, /server/i, /service/i, /\.py$/i, /\.java$/i],
  testing: [/test/i, /spec/i, /\.test\./i, /\.spec\./i, /__tests__/i],
  security: [/security/i, /encryption/i, /vulnerability/i, /sanitize/i, /validate/i],
  performance: [/performance/i, /optimize/i, /cache/i, /speed/i, /latency/i],
  config: [/config/i, /\.env/i, /\.yaml$/i, /\.yml$/i, /\.json$/i],
  infrastructure: [/docker/i, /kubernetes/i, /deploy/i, /ci\/cd/i, /\.github\/workflows/i],
};

// Action keywords
const ACTION_KEYWORDS: Record<string, string[]> = {
  optimize: ['optimize', 'optimization', 'performance', 'cache', 'speed', 'latency', 'efficiency'],
  implement: ['implement', 'add', 'create', 'build', 'introduce', 'feature'],
  fix: ['fix', 'resolve', 'solve', 'bug', 'error', 'issue', 'patch'],
  enhance: ['enhance', 'improve', 'upgrade', 'refine', 'polish'],
  refactor: ['refactor', 'restructure', 'reorganize', 'cleanup'],
  test: ['test', 'testing', 'coverage', 'spec', 'assert'],
  secure: ['secure', 'security', 'encrypt', 'sanitize', 'validate', 'auth'],
};

// Pattern rules for achievement generation
type TemplateFunction = (component: string, action?: string, files?: number) => string;

const ACHIEVEMENT_PATTERNS: Record<string, {
  keywords: string[];
  template: TemplateFunction;
}> = {
  performance: {
    keywords: ['performance', 'optimize', 'cache', 'speed', 'latency'],
    template: (component: string, action?: string) => `Optimized ${component} by ${action || 'optimizing'}`,
  },
  security: {
    keywords: ['security', 'encrypt', 'vulnerability', 'auth', 'sanitize'],
    template: (component: string) => `Enhanced security in ${component}`,
  },
  feature: {
    keywords: ['implement', 'add', 'create', 'feature', 'introduce'],
    template: (component: string, _action?: string, files?: number) => `Implemented ${component} feature affecting ${files || 0} modules`,
  },
  bugfix: {
    keywords: ['fix', 'resolve', 'bug', 'error', 'issue'],
    template: (component: string) => `Fixed ${component} bug`,
  },
  testing: {
    keywords: ['test', 'testing', 'coverage', 'spec'],
    template: (_component: string, action?: string) => `Improved code reliability with ${action || 'testing'}`,
  },
};

/**
 * Extract component from files changed
 */
function extractComponent(files: string[] = [], diffContent: string = ''): string {
  const combined = `${files.join(' ')} ${diffContent}`.toLowerCase();
  const componentScores: Record<string, number> = {};

  // Score components based on file paths and diff content
  for (const [component, patterns] of Object.entries(COMPONENT_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      // Check files
      score += files.filter(f => pattern.test(f)).length * 2;
      // Check diff content
      const matches = (combined.match(new RegExp(pattern.source, 'gi')) || []).length;
      score += matches;
    }
    if (score > 0) {
      componentScores[component] = score;
    }
  }

  // Return highest scoring component, or default
  if (Object.keys(componentScores).length > 0) {
    const topComponent = Object.entries(componentScores)
      .sort(([, a], [, b]) => b - a)[0][0];
    return topComponent.charAt(0).toUpperCase() + topComponent.slice(1);
  }

  // Default based on file types
  if (files.some(f => /\.(tsx|jsx|vue)$/i.test(f))) return 'UI';
  if (files.some(f => /\.(py|java|go|rs)$/i.test(f))) return 'Backend';
  if (files.some(f => /\.(sql|migration)/i.test(f))) return 'Database';
  
  return 'System';
}

/**
 * Extract action from commit message and diff content
 */
function extractAction(commitMessage: string, diffContent: string = ''): string {
  const combined = `${commitMessage} ${diffContent}`.toLowerCase();

  // Check for action keywords
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      // Return action in present participle form
      const actionMap: Record<string, string> = {
        optimize: 'optimizing',
        implement: 'implementing',
        fix: 'fixing',
        enhance: 'enhancing',
        refactor: 'refactoring',
        test: 'testing',
        secure: 'securing',
      };
      return actionMap[action] || action;
    }
  }

  // Default action based on diff patterns
  const addedLines = (diffContent.match(/^\+/gm) || []).length;
  const removedLines = (diffContent.match(/^-/gm) || []).length;

  if (addedLines > removedLines * 2) return 'implementing';
  if (removedLines > addedLines * 2) return 'fixing';
  return 'improving';
}

/**
 * Get diff content for analysis
 */
async function getDiffContent(commit: Commit, repoPath: string): Promise<string> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    return await git.diff([`${commit.hash}^`, commit.hash]);
  } catch (error) {
    return '';
  }
}

export async function generateAchievement(
  commit: Commit,
  repoPath: string,
  diffAnalysis: DiffAnalysis,
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
): Promise<AchievementResult> {
  // Check if we should use PR info (when commit message is not helpful and PR exists)
  const usePRInfo = !options.skipPR && !isCommitMessageHelpful(commit.message) && commit.prNumber;
  
  let achievementText = '';
  let confidence = 0.75; // Default confidence for pattern-based
  
  if (usePRInfo) {
    // Use PR title if already fetched
    if (commit.prTitle) {
      achievementText = commit.prTitle;
      confidence = 0.9; // Higher confidence for PR titles
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
        confidence = 0.9;
        // Store in commit for future use
        commit.prTitle = prInfo.title;
        commit.prDescription = prInfo.description;
        commit.prUrl = prInfo.url;
      } else if (prInfo?.number) {
        // PR number found but no title - use PR reference
        achievementText = `PR #${prInfo.number}`;
        confidence = 0.7;
      }
    }
  }
  
  // Fall back to pattern-based generation if PR not available or not helpful
  if (!achievementText) {
    // Get diff content for analysis
    const diffContent = await getDiffContent(commit, repoPath);
    const combinedText = `${commit.message} ${commit.body || ''} ${diffContent}`.toLowerCase();
    
    // Extract component and action
    const component = extractComponent(commit.files || [], diffContent);
    const action = extractAction(commit.message, diffContent);
    
    // Match against achievement patterns
    let matched = false;
    
    for (const [patternType, pattern] of Object.entries(ACHIEVEMENT_PATTERNS)) {
      if (pattern.keywords.some(keyword => combinedText.includes(keyword))) {
        matched = true;
        
        switch (patternType) {
          case 'performance':
            achievementText = pattern.template(component, action);
            break;
          case 'security':
            achievementText = pattern.template(component);
            break;
          case 'feature':
            achievementText = pattern.template(component, undefined, diffAnalysis.changeMetrics.filesModified);
            break;
          case 'bugfix':
            achievementText = pattern.template(component);
            break;
          case 'testing':
            achievementText = pattern.template('System', action);
            break;
        }
        break;
      }
    }
    
    // Fallback: generate based on impact level and metrics
    if (!matched) {
      const filesCount = diffAnalysis.changeMetrics.filesModified;
      
      if (diffAnalysis.impactLevel === 'high') {
        if (filesCount > 10) {
          achievementText = `Delivered major ${component.toLowerCase()} feature affecting ${filesCount} modules`;
        } else {
          achievementText = `Completed high-impact ${component.toLowerCase()} work`;
        }
      } else if (diffAnalysis.impactLevel === 'medium') {
        achievementText = `Delivered ${component.toLowerCase()} feature`;
      } else {
        achievementText = `Made ${component.toLowerCase()} improvements`;
      }
      confidence = 0.6; // Lower confidence for fallback
    }
  }
  
  return {
    achievement: achievementText || commit.message.substring(0, 60),
    confidence: confidence,
  };
}