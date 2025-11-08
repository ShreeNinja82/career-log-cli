import { Commit } from './git-parser.js';
import simpleGit, { SimpleGit } from 'simple-git';

export interface DiffAnalysis {
  impactLevel: 'high' | 'medium' | 'low';
  signals: string[];
  fileTypes: string[];
  changeMetrics: {
    totalLines: number;
    filesModified: number;
    criticalFilesModified: number;
  };
}

// Critical file patterns
const CRITICAL_FILE_PATTERNS = [
  /package\.json$/i,
  /package-lock\.json$/i,
  /yarn\.lock$/i,
  /dockerfile/i,
  /docker-compose/i,
  /\.dockerignore/i,
  /migrations?/i,
  /schema/i,
  /auth/i,
  /security/i,
  /api/i,
  /\.github\/workflows/i,
  /\.env/i,
  /config/i,
  /\.config\./i,
];

// Critical keywords
const CRITICAL_KEYWORDS = [
  'performance',
  'optimize',
  'cache',
  'security',
  'vulnerability',
  'auth',
  'encryption',
  'critical',
  'urgent',
  'hotfix',
  'breach',
  'exploit',
  'sql injection',
  'xss',
  'csrf',
];

// Performance keywords
const PERFORMANCE_KEYWORDS = [
  'performance',
  'optimize',
  'optimization',
  'cache',
  'caching',
  'speed',
  'latency',
  'throughput',
  'efficiency',
];

// File type detection patterns
const FILE_TYPE_PATTERNS: Record<string, RegExp[]> = {
  TypeScript: [/\.tsx?$/i, /tsconfig/i],
  JavaScript: [/\.jsx?$/i, /\.mjs$/i, /\.cjs$/i],
  Python: [/\.py$/i, /requirements\.txt/i, /setup\.py/i],
  Java: [/\.java$/i, /\.class$/i],
  Go: [/\.go$/i, /go\.mod/i],
  Rust: [/\.rs$/i, /Cargo\.toml/i],
  Docker: [/dockerfile/i, /docker-compose/i, /\.dockerignore/i],
  Tests: [/\.test\./i, /\.spec\./i, /__tests__/i, /test\//i, /tests\//i],
  Config: [/\.config\./i, /\.env/i, /\.json$/i, /\.yaml$/i, /\.yml$/i],
  CSS: [/\.css$/i, /\.scss$/i, /\.sass$/i, /\.less$/i],
  HTML: [/\.html$/i, /\.htm$/i],
  Markdown: [/\.md$/i, /\.markdown$/i],
  SQL: [/\.sql$/i],
  Shell: [/\.sh$/i, /\.bash$/i, /\.zsh$/i],
};

export async function analyzeDiff(
  commit: Commit,
  repoPath: string
): Promise<DiffAnalysis> {
  const git: SimpleGit = simpleGit(repoPath);
  const signals: string[] = [];
  const fileTypes = new Set<string>();
  let totalLines = (commit.insertions || 0) + (commit.deletions || 0);
  const filesModified = commit.files?.length || 0;
  let criticalFilesModified = 0;

  // Analyze file types
  if (commit.files) {
    for (const file of commit.files) {
      // Check for critical files
      const isCritical = CRITICAL_FILE_PATTERNS.some((pattern) =>
        pattern.test(file)
      );
      if (isCritical) {
        criticalFilesModified++;
        signals.push(`Critical file modified: ${file}`);
      }

      // Detect file types
      for (const [type, patterns] of Object.entries(FILE_TYPE_PATTERNS)) {
        if (patterns.some((pattern) => pattern.test(file))) {
          fileTypes.add(type);
          break;
        }
      }
    }
  }

  // Get actual diff content for deeper analysis
  try {
    const diff = await git.diff([`${commit.hash}^`, commit.hash]);
    const diffLower = diff.toLowerCase();

    // Check for critical keywords in diff
    for (const keyword of CRITICAL_KEYWORDS) {
      if (diffLower.includes(keyword.toLowerCase())) {
        signals.push(`Critical keyword found: ${keyword}`);
        break; // Only add once
      }
    }

    // Check for performance keywords
    for (const keyword of PERFORMANCE_KEYWORDS) {
      if (diffLower.includes(keyword.toLowerCase())) {
        signals.push(`Performance-related changes detected`);
        break;
      }
    }

    // Analyze diff patterns
    const addedLines = (diff.match(/^\+/gm) || []).length;
    const removedLines = (diff.match(/^-/gm) || []).length;

    // Detect large refactoring (many deletions, many additions)
    if (removedLines > 100 && addedLines > 100) {
      signals.push('Large refactoring detected');
    }

    // Detect new feature (many additions, few deletions)
    if (addedLines > 200 && removedLines < 50) {
      signals.push('New feature implementation');
    }

    // Detect bug fix (few additions, many deletions)
    if (removedLines > 50 && addedLines < removedLines * 0.5) {
      signals.push('Bug fix pattern detected');
    }
  } catch (error) {
    // If diff fails (e.g., first commit), use summary stats
    // This is already handled by the basic metrics
  }

  // Determine impact level based on criteria
  let impactLevel: 'high' | 'medium' | 'low' = 'low';

  // HIGH impact conditions
  if (
    totalLines > 500 ||
    criticalFilesModified > 0 ||
    signals.some((s) => s.includes('Critical'))
  ) {
    impactLevel = 'high';
    if (totalLines > 500) {
      signals.push(`Large change: ${totalLines} lines`);
    }
  }
  // MEDIUM impact conditions
  else if (
    (totalLines >= 100 && totalLines <= 500) ||
    (filesModified >= 3 && filesModified <= 10) ||
    signals.some((s) => s.includes('Performance'))
  ) {
    impactLevel = 'medium';
    if (totalLines >= 100) {
      signals.push(`Moderate change: ${totalLines} lines`);
    }
    if (filesModified >= 3) {
      signals.push(`Multiple files: ${filesModified} files`);
    }
  }
  // LOW impact (default)
  else {
    if (totalLines < 100) {
      signals.push(`Small change: ${totalLines} lines`);
    }
    if (filesModified <= 2) {
      signals.push(`Few files: ${filesModified} file(s)`);
    }
  }

  return {
    impactLevel,
    signals: signals.length > 0 ? signals : ['Standard commit'],
    fileTypes: Array.from(fileTypes).sort(),
    changeMetrics: {
      totalLines,
      filesModified,
      criticalFilesModified,
    },
  };
}
