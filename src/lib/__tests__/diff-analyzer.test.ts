import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeDiff } from '../diff-analyzer.js';
import { Commit } from '../git-parser.js';

// Mock simple-git at module level
vi.mock('simple-git', () => {
  return {
    default: vi.fn(() => ({
      diff: vi.fn(),
    })),
  };
});

describe('diff-analyzer', () => {
  const mockCommit: Commit = {
    hash: 'abc123',
    date: '2024-01-01',
    message: 'Test commit',
    author: 'test',
    files: ['src/auth/login.ts', 'package.json'],
    insertions: 200,
    deletions: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeDiff', () => {
    it('should detect high impact for large changes', async () => {
      const simpleGit = await import('simple-git');
      const mockGit = {
        diff: vi.fn().mockResolvedValue('+many lines\n-many lines'),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(mockCommit, '/tmp/repo');

      expect(result.impactLevel).toBe('high');
      expect(result.changeMetrics.totalLines).toBe(250);
      expect(result.changeMetrics.filesModified).toBe(2);
    });

    it('should detect critical files', async () => {
      const commitWithCritical: Commit = {
        ...mockCommit,
        files: ['package.json', 'src/auth.ts'],
      };

      const simpleGit = await import('simple-git');
      const mockGit = {
        diff: vi.fn().mockResolvedValue(''),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(commitWithCritical, '/tmp/repo');

      expect(result.changeMetrics.criticalFilesModified).toBeGreaterThan(0);
    });

    it('should detect file types', async () => {
      const commitWithTypes: Commit = {
        ...mockCommit,
        files: ['src/app.tsx', 'src/style.css', 'test.spec.ts'],
      };

      const simpleGit = await import('simple-git');
      const mockGit = {
        diff: vi.fn().mockResolvedValue(''),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(commitWithTypes, '/tmp/repo');

      expect(result.fileTypes.length).toBeGreaterThan(0);
      expect(result.fileTypes).toContain('TypeScript');
    });

    it('should detect performance keywords in diff', async () => {
      const simpleGit = await import('simple-git');
      const mockGit = {
        diff: vi.fn().mockResolvedValue('+optimize performance\n+cache results'),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(mockCommit, '/tmp/repo');

      expect(result.signals.some(s => s.includes('Performance'))).toBe(true);
    });

    it('should detect security keywords in diff', async () => {
      const simpleGit = await import('simple-git');
      const mockGit = {
        diff: vi.fn().mockResolvedValue('+enhance security\n+encrypt data'),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(mockCommit, '/tmp/repo');

      expect(result.signals.some(s => s.includes('Critical') || s.includes('security'))).toBe(true);
    });

    it('should detect large refactoring pattern', async () => {
      const simpleGit = await import('simple-git');
      // Many additions and deletions
      const largeDiff = Array(150).fill('+new line').join('\n') + '\n' + Array(150).fill('-old line').join('\n');
      const mockGit = {
        diff: vi.fn().mockResolvedValue(largeDiff),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(mockCommit, '/tmp/repo');

      expect(result.signals.some(s => s.includes('refactoring'))).toBe(true);
    });

    it('should detect new feature pattern', async () => {
      const simpleGit = await import('simple-git');
      // Many additions, few deletions
      const featureDiff = Array(250).fill('+new feature code').join('\n') + '\n' + Array(20).fill('-old code').join('\n');
      const mockGit = {
        diff: vi.fn().mockResolvedValue(featureDiff),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(mockCommit, '/tmp/repo');

      expect(result.signals.some(s => s.includes('feature') || s.includes('New feature'))).toBe(true);
    });

    it('should detect bug fix pattern', async () => {
      const simpleGit = await import('simple-git');
      // Few additions, many deletions
      const bugFixDiff = Array(20).fill('+fix').join('\n') + '\n' + Array(100).fill('-buggy code').join('\n');
      const mockGit = {
        diff: vi.fn().mockResolvedValue(bugFixDiff),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(mockCommit, '/tmp/repo');

      expect(result.signals.some(s => s.includes('Bug fix') || s.includes('fix'))).toBe(true);
    });

    it('should handle diff fetch errors gracefully', async () => {
      const simpleGit = await import('simple-git');
      const mockGit = {
        diff: vi.fn().mockRejectedValue(new Error('Diff failed')),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeDiff(mockCommit, '/tmp/repo');

      // Should still return analysis based on commit metadata
      expect(result).toBeDefined();
      expect(result.impactLevel).toBeDefined();
    });

    it('should classify impact level correctly', async () => {
      const simpleGit = await import('simple-git');
      const mockGit = {
        diff: vi.fn().mockResolvedValue(''),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      // High impact - many lines
      const highCommit: Commit = {
        ...mockCommit,
        insertions: 400,
        deletions: 200,
      };
      const highResult = await analyzeDiff(highCommit, '/tmp/repo');
      expect(highResult.impactLevel).toBe('high');

      // Medium impact
      const mediumCommit: Commit = {
        ...mockCommit,
        insertions: 150,
        deletions: 50,
        files: Array(5).fill('file.ts'),
      };
      const mediumResult = await analyzeDiff(mediumCommit, '/tmp/repo');
      expect(['high', 'medium']).toContain(mediumResult.impactLevel);

      // Low impact
      const lowCommit: Commit = {
        ...mockCommit,
        insertions: 20,
        deletions: 5,
        files: ['file.ts'],
      };
      const lowResult = await analyzeDiff(lowCommit, '/tmp/repo');
      expect(lowResult.impactLevel).toBe('low');
    });
  });
});
