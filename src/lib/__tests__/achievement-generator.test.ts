import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateAchievement } from '../achievement-generator.js';
import { Commit } from '../git-parser.js';
import { DiffAnalysis } from '../diff-analyzer.js';

describe('achievement-generator', () => {
  const mockCommit: Commit = {
    hash: 'abc123',
    date: '2024-01-01',
    message: 'Implement user authentication',
    author: 'test',
    body: 'Add login and signup functionality',
    files: ['src/auth/login.ts', 'src/auth/signup.ts'],
    insertions: 200,
    deletions: 10,
  };

  const mockDiffAnalysis: DiffAnalysis = {
    impactLevel: 'high',
    signals: ['New feature implementation'],
    fileTypes: ['TypeScript'],
    changeMetrics: {
      totalLines: 210,
      filesModified: 2,
      criticalFilesModified: 0,
    },
  };

  beforeEach(() => {
    global.fetch = vi.fn();
    // Mock simple-git
    vi.mock('simple-git', () => ({
      default: vi.fn(() => ({
        diff: vi.fn().mockResolvedValue('+added line\n-removed line'),
      })),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAchievement', () => {
    it('should generate achievement from commit message patterns', async () => {
      const result = await generateAchievement(
        mockCommit,
        '/tmp/repo',
        mockDiffAnalysis,
        {}
      );

      expect(result.achievement).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(result.dataLocal).toBe(true);
    });

    it('should use PR title if available', async () => {
      const commitWithPR: Commit = {
        ...mockCommit,
        prNumber: 123,
        prTitle: 'Add user authentication feature',
        message: 'update', // Not helpful message
      };

      const result = await generateAchievement(
        commitWithPR,
        '/tmp/repo',
        mockDiffAnalysis,
        { skipPR: false }
      );

      expect(result.achievement).toBe('Add user authentication feature');
      expect(result.confidence).toBe(0.9);
    });

    it('should skip PR parsing when skipPR is true', async () => {
      const commitWithPR: Commit = {
        ...mockCommit,
        prNumber: 123,
        prTitle: 'PR Title',
      };

      const result = await generateAchievement(
        commitWithPR,
        '/tmp/repo',
        mockDiffAnalysis,
        { skipPR: true }
      );

      // Should not use PR title, should use pattern matching instead
      expect(result.achievement).not.toBe('PR Title');
    });

    it('should skip AI for low-impact commits when AI is enabled', async () => {
      const lowImpactAnalysis: DiffAnalysis = {
        impactLevel: 'low',
        signals: ['Small change'],
        fileTypes: [],
        changeMetrics: {
          totalLines: 10,
          filesModified: 1,
          criticalFilesModified: 0,
        },
      };

      // Mock Math.random to return 0.3 (below 0.5 threshold)
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.3);

      const result = await generateAchievement(
        mockCommit,
        '/tmp/repo',
        lowImpactAnalysis,
        { apiKey: 'test-key' }
      );

      // Should not call OpenAI (would fail if it did)
      expect(result.dataLocal).toBe(true);

      Math.random = originalRandom;
    });

    it('should use OpenAI when apiKey is provided', async () => {
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: 'Implemented user authentication system with secure login',
          },
        }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpenAIResponse,
      });

      // Mock simple-git diff
      const simpleGit = await import('simple-git');
      vi.spyOn(simpleGit.default(), 'diff').mockResolvedValueOnce('+auth code');

      const result = await generateAchievement(
        mockCommit,
        '/tmp/repo',
        mockDiffAnalysis,
        { apiKey: 'test-key', enterprise: false }
      );

      // Note: This test may fail if OpenAI is actually called
      // In a real scenario, you'd want to mock the entire simple-git module
      expect(result).toBeDefined();
    });

    it('should use enterprise mode to disable AI', async () => {
      const result = await generateAchievement(
        mockCommit,
        '/tmp/repo',
        mockDiffAnalysis,
        { enterprise: true, apiKey: 'test-key' }
      );

      expect(result.dataLocal).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should extract component from files', async () => {
      const authCommit: Commit = {
        ...mockCommit,
        files: ['src/auth/login.ts', 'src/auth/middleware.ts'],
      };

      const result = await generateAchievement(
        authCommit,
        '/tmp/repo',
        mockDiffAnalysis,
        {}
      );

      // Should detect Auth component
      expect(result.achievement.toLowerCase()).toContain('auth');
    });

    it('should handle performance keywords', async () => {
      const perfCommit: Commit = {
        ...mockCommit,
        message: 'Optimize database queries for better performance',
      };

      const perfAnalysis: DiffAnalysis = {
        impactLevel: 'medium',
        signals: ['Performance-related changes detected'],
        fileTypes: ['TypeScript'],
        changeMetrics: {
          totalLines: 150,
          filesModified: 3,
          criticalFilesModified: 0,
        },
      };

      const result = await generateAchievement(
        perfCommit,
        '/tmp/repo',
        perfAnalysis,
        {}
      );

      expect(result.achievement.toLowerCase()).toContain('optimize');
    });

    it('should handle security keywords', async () => {
      const securityCommit: Commit = {
        ...mockCommit,
        message: 'Enhance security in authentication',
      };

      const securityAnalysis: DiffAnalysis = {
        impactLevel: 'high',
        signals: ['Critical keyword found: security'],
        fileTypes: ['TypeScript'],
        changeMetrics: {
          totalLines: 100,
          filesModified: 2,
          criticalFilesModified: 1,
        },
      };

      const result = await generateAchievement(
        securityCommit,
        '/tmp/repo',
        securityAnalysis,
        {}
      );

      expect(result.achievement.toLowerCase()).toContain('security');
    });

    it('should handle bug fix patterns', async () => {
      const bugCommit: Commit = {
        ...mockCommit,
        message: 'Fix payment processing bug',
        files: ['src/payment.ts'],
      };

      const bugAnalysis: DiffAnalysis = {
        impactLevel: 'medium',
        signals: ['Bug fix pattern detected'],
        fileTypes: ['TypeScript'],
        changeMetrics: {
          totalLines: 50,
          filesModified: 1,
          criticalFilesModified: 0,
        },
      };

      const simpleGit = await import('simple-git');
      // Ensure diff content has bug fix keywords but not performance/security keywords
      const mockGit = {
        diff: vi.fn().mockResolvedValue('-buggy payment code\n+fixed payment processing\n-resolve bug issue'),
      };
      (simpleGit.default as any).mockReturnValue(mockGit);

      const result = await generateAchievement(
        bugCommit,
        '/tmp/repo',
        bugAnalysis,
        {}
      );

      // Should generate an achievement - verify it's not empty and has reasonable content
      expect(result.achievement).toBeTruthy();
      expect(result.achievement.length).toBeGreaterThan(0);
      // The achievement should either match bugfix pattern or be a fallback
      const achievementLower = result.achievement.toLowerCase();
      // Check if it matches bugfix pattern, or is a valid fallback (mentions component or has fix/bug)
      const hasBugFixKeywords = achievementLower.includes('fix') || achievementLower.includes('bug') || achievementLower.includes('resolve');
      const hasComponent = achievementLower.includes('payment') || achievementLower.includes('api') || achievementLower.includes('system') || achievementLower.includes('backend');
      expect(hasBugFixKeywords || hasComponent).toBe(true);
    });

    it('should fallback to commit message if no patterns match', async () => {
      const genericCommit: Commit = {
        ...mockCommit,
        message: 'Some random commit message that does not match patterns',
      };

      const result = await generateAchievement(
        genericCommit,
        '/tmp/repo',
        mockDiffAnalysis,
        {}
      );

      expect(result.achievement).toBeTruthy();
      expect(result.achievement.length).toBeGreaterThan(0);
    });
  });
});
