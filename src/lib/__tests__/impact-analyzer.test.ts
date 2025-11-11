import { describe, it, expect, vi } from 'vitest';
import { getImpactLevel, analyzeImpact } from '../impact-analyzer.js';
import { Commit } from '../git-parser.js';

// Mock simple-git at module level
vi.mock('simple-git', () => {
  return {
    default: vi.fn(() => ({
      diff: vi.fn(),
    })),
  };
});

describe('impact-analyzer', () => {
  describe('getImpactLevel', () => {
    it('should return high for large changes', () => {
      const commit: Commit = {
        hash: 'abc123',
        date: '2024-01-01',
        message: 'Large change',
        author: 'test',
        insertions: 300,
        deletions: 300,
        files: Array(25).fill('file.ts'),
      };

      expect(getImpactLevel(commit)).toBe('high');
    });

    it('should return high for many files', () => {
      const commit: Commit = {
        hash: 'abc123',
        date: '2024-01-01',
        message: 'Many files',
        author: 'test',
        insertions: 50,
        deletions: 10,
        files: Array(25).fill('file.ts'),
      };

      expect(getImpactLevel(commit)).toBe('high');
    });

    it('should return low for small changes', () => {
      const commit: Commit = {
        hash: 'abc123',
        date: '2024-01-01',
        message: 'Small change',
        author: 'test',
        insertions: 10,
        deletions: 5,
        files: ['file.ts'],
      };

      expect(getImpactLevel(commit)).toBe('low');
    });

    it('should return medium for moderate changes', () => {
      const commit: Commit = {
        hash: 'abc123',
        date: '2024-01-01',
        message: 'Moderate change',
        author: 'test',
        insertions: 150,
        deletions: 50,
        files: ['file1.ts', 'file2.ts', 'file3.ts'],
      };

      expect(getImpactLevel(commit)).toBe('medium');
    });

    it('should handle missing insertions/deletions', () => {
      const commit: Commit = {
        hash: 'abc123',
        date: '2024-01-01',
        message: 'No stats',
        author: 'test',
      };

      expect(getImpactLevel(commit)).toBe('low');
    });
  });

  describe('analyzeImpact', () => {
    it('should call analyzeDiff from diff-analyzer', async () => {
      const commit: Commit = {
        hash: 'abc123',
        date: '2024-01-01',
        message: 'Test commit',
        author: 'test',
        files: ['test.ts'],
        insertions: 100,
        deletions: 10,
      };

      // Mock simple-git
      const simpleGit = await import('simple-git');
      const mockGit = {
        diff: vi.fn().mockResolvedValue('+test\n-test'),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await analyzeImpact(commit, process.cwd());
      
      // Should return a DiffAnalysis object
      expect(result).toHaveProperty('impactLevel');
      expect(result).toHaveProperty('signals');
      expect(result).toHaveProperty('fileTypes');
      expect(result).toHaveProperty('changeMetrics');
      expect(['high', 'medium', 'low']).toContain(result.impactLevel);
    });
  });
});
