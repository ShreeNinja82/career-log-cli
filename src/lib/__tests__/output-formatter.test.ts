import { describe, it, expect } from 'vitest';
import { formatOutput, CareerLog, CareerLogEntry } from '../output-formatter.js';

describe('output-formatter', () => {
  const mockCareerLog: CareerLog = {
    generatedAt: '2024-01-01T00:00:00.000Z',
    repository: '/path/to/repo',
    totalCommits: 2,
    entries: [
      {
        date: '2024-01-01T10:00:00.000Z',
        achievement: 'Implemented authentication feature',
        confidence: 0.9,
        aiGenerated: true,
        dataLocal: false,
        impact: 'high',
        commit: 'abc12345',
        filesChanged: 5,
        linesChanged: 200,
        signals: ['New feature implementation'],
        fileTypes: ['TypeScript', 'JavaScript'],
        changeMetrics: {
          totalLines: 200,
          filesModified: 5,
          criticalFilesModified: 1,
        },
      },
      {
        date: '2024-01-02T10:00:00.000Z',
        achievement: 'Fixed bug in payment processing',
        confidence: 0.75,
        impact: 'medium',
        commit: 'def67890',
        filesChanged: 2,
        linesChanged: 50,
      },
    ],
  };

  describe('formatOutput', () => {
    it('should format as JSON', () => {
      const result = formatOutput(mockCareerLog, 'json');
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual(mockCareerLog);
      expect(result).toContain('"achievement"');
      expect(result).toContain('"impact"');
    });

    it('should format as Markdown', () => {
      const result = formatOutput(mockCareerLog, 'md');
      
      expect(result).toContain('# Career Log');
      expect(result).toContain('**Repository:**');
      expect(result).toContain('**Generated:**');
      expect(result).toContain('**Total Commits:**');
      expect(result).toContain('## 2024-01-01');
      expect(result).toContain('## 2024-01-02');
      expect(result).toContain('🔥');
      expect(result).toContain('Implemented authentication feature');
    });

    it('should default to JSON for unknown format', () => {
      const result = formatOutput(mockCareerLog, 'unknown' as any);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual(mockCareerLog);
    });
  });

  describe('formatMarkdown', () => {
    it('should group entries by date', () => {
      const log: CareerLog = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        repository: '/path/to/repo',
        totalCommits: 2,
        entries: [
          {
            date: '2024-01-01T10:00:00.000Z',
            achievement: 'First achievement',
            impact: 'high',
            commit: 'abc123',
          },
          {
            date: '2024-01-01T11:00:00.000Z',
            achievement: 'Second achievement',
            impact: 'medium',
            commit: 'def456',
          },
        ],
      };

      const result = formatOutput(log, 'md');
      
      // Should have one date section with both entries
      const dateSectionCount = (result.match(/## \d{4}-\d{2}-\d{2}/g) || []).length;
      expect(dateSectionCount).toBe(1);
      expect(result).toContain('First achievement');
      expect(result).toContain('Second achievement');
    });

    it('should display impact badges correctly', () => {
      const log: CareerLog = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        repository: '/path/to/repo',
        totalCommits: 3,
        entries: [
          { date: '2024-01-01', achievement: 'High', impact: 'high', commit: 'abc' },
          { date: '2024-01-01', achievement: 'Medium', impact: 'medium', commit: 'def' },
          { date: '2024-01-01', achievement: 'Low', impact: 'low', commit: 'ghi' },
        ],
      };

      const result = formatOutput(log, 'md');
      
      expect(result).toContain('🔥');
      expect(result).toContain('⭐');
      expect(result).toContain('📝');
    });

    it('should display file and line counts when available', () => {
      const log: CareerLog = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        repository: '/path/to/repo',
        totalCommits: 1,
        entries: [
          {
            date: '2024-01-01',
            achievement: 'Test',
            impact: 'high',
            commit: 'abc',
            filesChanged: 5,
            linesChanged: 100,
          },
        ],
      };

      const result = formatOutput(log, 'md');
      
      expect(result).toContain('Files: 5');
      expect(result).toContain('Lines: 100');
    });

    it('should display file types when available', () => {
      const log: CareerLog = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        repository: '/path/to/repo',
        totalCommits: 1,
        entries: [
          {
            date: '2024-01-01',
            achievement: 'Test',
            impact: 'high',
            commit: 'abc',
            fileTypes: ['TypeScript', 'JavaScript'],
          },
        ],
      };

      const result = formatOutput(log, 'md');
      
      expect(result).toContain('File Types: TypeScript, JavaScript');
    });

    it('should display signals when available', () => {
      const log: CareerLog = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        repository: '/path/to/repo',
        totalCommits: 1,
        entries: [
          {
            date: '2024-01-01',
            achievement: 'Test',
            impact: 'high',
            commit: 'abc',
            signals: ['New feature', 'Performance improvement'],
          },
        ],
      };

      const result = formatOutput(log, 'md');
      
      expect(result).toContain('Signals:');
      expect(result).toContain('New feature');
    });

    it('should display critical files warning when applicable', () => {
      const log: CareerLog = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        repository: '/path/to/repo',
        totalCommits: 1,
        entries: [
          {
            date: '2024-01-01',
            achievement: 'Test',
            impact: 'high',
            commit: 'abc',
            changeMetrics: {
              totalLines: 100,
              filesModified: 5,
              criticalFilesModified: 2,
            },
          },
        ],
      };

      const result = formatOutput(log, 'md');
      
      expect(result).toContain('⚠️ Critical files modified: 2');
    });

    it('should not display "Standard commit" signal', () => {
      const log: CareerLog = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        repository: '/path/to/repo',
        totalCommits: 1,
        entries: [
          {
            date: '2024-01-01',
            achievement: 'Test',
            impact: 'low',
            commit: 'abc',
            signals: ['Standard commit'],
          },
        ],
      };

      const result = formatOutput(log, 'md');
      
      expect(result).not.toContain('Signals: Standard commit');
    });
  });
});
