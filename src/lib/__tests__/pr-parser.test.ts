import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractPRNumber,
  isCommitMessageHelpful,
  fetchPRFromGitHub,
  fetchPRFromGitLab,
  detectRepoInfo,
  getPRInfo,
} from '../pr-parser.js';

// Mock child_process module
vi.mock('child_process', async () => {
  const actual = await vi.importActual('child_process');
  return {
    ...actual,
    execSync: vi.fn(),
  };
});

describe('pr-parser', () => {
  describe('extractPRNumber', () => {
    it('should extract PR number from "fixes #123"', () => {
      expect(extractPRNumber('fixes #123')).toBe(123);
    });

    it('should extract PR number from "closes PR #456"', () => {
      expect(extractPRNumber('closes PR #456')).toBe(456);
    });

    it('should extract PR number from "resolves #789"', () => {
      expect(extractPRNumber('resolves #789')).toBe(789);
    });

    it('should extract PR number from "PR: 42"', () => {
      expect(extractPRNumber('PR: 42')).toBe(42);
    });

    it('should extract PR number from "pull request #99"', () => {
      expect(extractPRNumber('pull request #99')).toBe(99);
    });

    it('should extract PR number from commit body', () => {
      expect(extractPRNumber('Update', 'Fixes #100')).toBe(100);
    });

    it('should return null if no PR number found', () => {
      expect(extractPRNumber('just a regular commit')).toBeNull();
    });

    it('should handle multiple PR references and return first', () => {
      expect(extractPRNumber('fixes #1 and closes #2')).toBe(1);
    });
  });

  describe('isCommitMessageHelpful', () => {
    it('should return false for short messages', () => {
      expect(isCommitMessageHelpful('fix')).toBe(false);
      expect(isCommitMessageHelpful('update')).toBe(false);
    });

    it('should return false for generic messages', () => {
      expect(isCommitMessageHelpful('update')).toBe(false);
      expect(isCommitMessageHelpful('fix')).toBe(false);
      expect(isCommitMessageHelpful('changes')).toBe(false);
      expect(isCommitMessageHelpful('wip')).toBe(false);
      expect(isCommitMessageHelpful('merge')).toBe(false);
      expect(isCommitMessageHelpful('bump')).toBe(false);
    });

    it('should return true for descriptive messages', () => {
      expect(isCommitMessageHelpful('Implement user authentication feature')).toBe(true);
      expect(isCommitMessageHelpful('Fix bug in payment processing')).toBe(true);
      expect(isCommitMessageHelpful('Add support for dark mode')).toBe(true);
    });

    it('should handle whitespace correctly', () => {
      expect(isCommitMessageHelpful('   update   ')).toBe(false);
      expect(isCommitMessageHelpful('   Implement feature   ')).toBe(true);
    });
  });

  describe('fetchPRFromGitHub', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return null if no API key provided', async () => {
      const result = await fetchPRFromGitHub('owner', 'repo', 123);
      expect(result).toBeNull();
    });

    it('should fetch PR details from GitHub API', async () => {
      const mockResponse = {
        title: 'Test PR',
        body: 'PR description',
        html_url: 'https://github.com/owner/repo/pull/123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPRFromGitHub('owner', 'repo', 123, 'token');
      
      expect(result).toEqual({
        number: 123,
        title: 'Test PR',
        description: 'PR description',
        url: 'https://github.com/owner/repo/pull/123',
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/pulls/123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'token token',
          }),
        })
      );
    });

    it('should return null on API error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const result = await fetchPRFromGitHub('owner', 'repo', 123, 'token');
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchPRFromGitHub('owner', 'repo', 123, 'token');
      expect(result).toBeNull();
    });
  });

  describe('fetchPRFromGitLab', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return null if no API key provided', async () => {
      const result = await fetchPRFromGitLab('project/path', 123);
      expect(result).toBeNull();
    });

    it('should fetch PR details from GitLab API', async () => {
      const mockResponse = {
        title: 'Test MR',
        description: 'MR description',
        web_url: 'https://gitlab.com/project/path/merge_requests/123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPRFromGitLab('project/path', 123, 'token');
      
      expect(result).toEqual({
        number: 123,
        title: 'Test MR',
        description: 'MR description',
        url: 'https://gitlab.com/project/path/merge_requests/123',
      });
    });

    it('should use custom GitLab URL', async () => {
      const mockResponse = {
        title: 'Test MR',
        description: 'MR description',
        web_url: 'https://custom.gitlab.com/project/path/merge_requests/123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchPRFromGitLab('project/path', 123, 'token', 'https://custom.gitlab.com');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.gitlab.com/api/v4/projects/project%2Fpath/merge_requests/123',
        expect.any(Object)
      );
    });
  });

  describe('detectRepoInfo', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should detect GitHub repository', async () => {
      const { execSync } = await import('child_process');
      (execSync as any).mockReturnValueOnce(
        'https://github.com/owner/repo.git'
      );

      const result = await detectRepoInfo('/path/to/repo');
      
      expect(result.platform).toBe('github');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should detect GitLab repository', async () => {
      const { execSync } = await import('child_process');
      (execSync as any).mockReturnValueOnce(
        'https://gitlab.com/group/project.git'
      );

      const result = await detectRepoInfo('/path/to/repo');
      
      expect(result.platform).toBe('gitlab');
      expect(result.projectPath).toBe('group/project');
    });

    it('should return unknown for unrecognized URLs', async () => {
      const { execSync } = await import('child_process');
      (execSync as any).mockReturnValueOnce(
        'file:///local/path/to/repo.git'
      );

      const result = await detectRepoInfo('/path/to/repo');
      
      expect(result.platform).toBe('unknown');
    });

    it('should return unknown on error', async () => {
      const { execSync } = await import('child_process');
      (execSync as any).mockImplementationOnce(() => {
        throw new Error('Command failed');
      });

      const result = await detectRepoInfo('/path/to/repo');
      
      expect(result.platform).toBe('unknown');
    });
  });

  describe('getPRInfo', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return null if skipPR is true', async () => {
      const result = await getPRInfo('fixes #123', undefined, '/path', { skipPR: true });
      expect(result).toBeNull();
    });

    it('should return null if no PR number found', async () => {
      const result = await getPRInfo('regular commit', undefined, '/path', {});
      expect(result).toBeNull();
    });

    it('should return basic PR info without API tokens', async () => {
      const result = await getPRInfo('fixes #123', undefined, '/path', {});
      expect(result).toEqual({ number: 123 });
    });

    it('should fetch from GitHub API if token provided', async () => {
      const { execSync } = await import('child_process');
      (execSync as any).mockReturnValueOnce(
        'https://github.com/owner/repo.git'
      );

      const mockResponse = {
        title: 'Test PR',
        body: 'Description',
        html_url: 'https://github.com/owner/repo/pull/123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPRInfo('fixes #123', undefined, '/path', {
        githubToken: 'token',
      });

      expect(result).toEqual({
        number: 123,
        title: 'Test PR',
        description: 'Description',
        url: 'https://github.com/owner/repo/pull/123',
      });
    });
  });
});
