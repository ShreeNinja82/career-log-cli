export interface CareerLogEntry {
  date: string;
  achievement: string;
  confidence?: number;
  aiGenerated?: boolean;
  dataLocal?: boolean;
  impact: 'high' | 'medium' | 'low';
  commit: string;
  filesChanged?: number;
  linesChanged?: number;
  signals?: string[];
  fileTypes?: string[];
  changeMetrics?: {
    totalLines: number;
    filesModified: number;
    criticalFilesModified: number;
  };
}

export interface CareerLog {
  generatedAt: string;
  repository: string;
  totalCommits: number;
  entries: CareerLogEntry[];
}

export function formatOutput(
  data: CareerLog,
  format: 'json' | 'md'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);

    case 'md':
      return formatMarkdown(data);

    default:
      return JSON.stringify(data, null, 2);
  }
}

function formatMarkdown(data: CareerLog): string {
  let output = `# Career Log\n\n`;
  output += `**Repository:** ${data.repository}\n`;
  output += `**Generated:** ${data.generatedAt}\n`;
  output += `**Total Commits:** ${data.totalCommits}\n\n`;
  output += `---\n\n`;

  // Group by date
  const byDate = data.entries.reduce((acc, entry) => {
    const date = entry.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, CareerLogEntry[]>);

  for (const [date, entries] of Object.entries(byDate).sort().reverse()) {
    output += `## ${date}\n\n`;
    for (const entry of entries) {
      const impactBadge = entry.impact === 'high' ? '🔥' : entry.impact === 'medium' ? '⭐' : '📝';
      output += `- ${impactBadge} **${entry.achievement}**\n`;
      if (entry.filesChanged || entry.linesChanged) {
        output += `  - Files: ${entry.filesChanged || 0}, Lines: ${entry.linesChanged || 0}\n`;
      }
      if (entry.fileTypes && entry.fileTypes.length > 0) {
        output += `  - File Types: ${entry.fileTypes.join(', ')}\n`;
      }
      if (entry.signals && entry.signals.length > 0 && entry.signals[0] !== 'Standard commit') {
        output += `  - Signals: ${entry.signals.slice(0, 3).join('; ')}\n`;
      }
      if (entry.changeMetrics && entry.changeMetrics.criticalFilesModified > 0) {
        output += `  - ⚠️ Critical files modified: ${entry.changeMetrics.criticalFilesModified}\n`;
      }
    }
    output += `\n`;
  }

  return output;
}