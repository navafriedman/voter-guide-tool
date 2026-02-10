import type { VoterGuide, BallotData, RecommendationStatus } from '@/types';

const STATUS_LABELS: Record<RecommendationStatus, string> = {
  top_pick: 'Top Pick',
  yes: 'Yes',
  no: 'No',
  strong_no: 'Strong No',
  none: '',
};

export interface ExportRow {
  race: string;
  district: string;
  candidate: string;
  party: string;
  title: string;
  recommendation: string;
  commentary: string;
  candidate_website: string;
  candidate_twitter: string;
  candidate_facebook: string;
  candidate_instagram: string;
}

export function exportGuideToCSV(guide: VoterGuide, ballot: BallotData): string {
  const rows: ExportRow[] = [];

  // Iterate through all races and candidates
  for (const race of ballot.races) {
    for (const candidate of race.candidates) {
      // Find recommendation for this candidate
      const recommendation = guide.recommendations.find(
        r => r.raceId === race.id && r.candidateId === candidate.id
      );

      const row: ExportRow = {
        race: race.name,
        district: race.district || '',
        candidate: candidate.name,
        party: candidate.party || '',
        title: candidate.title || '',
        recommendation: recommendation ? STATUS_LABELS[recommendation.status] : '',
        commentary: recommendation?.reason || '',
        candidate_website: candidate.website || '',
        candidate_twitter: candidate.twitter || '',
        candidate_facebook: candidate.facebook || '',
        candidate_instagram: candidate.instagram || '',
      };

      rows.push(row);
    }
  }

  // Convert to CSV
  const headers = [
    'race',
    'district',
    'candidate',
    'party',
    'title',
    'recommendation',
    'commentary',
    'candidate_website',
    'candidate_twitter',
    'candidate_facebook',
    'candidate_instagram',
  ];

  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(header => {
        const value = row[header as keyof ExportRow];
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ];

  return csvRows.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function generateExportFilename(guideName: string): string {
  const sanitized = guideName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date().toISOString().split('T')[0];
  return `${sanitized}-${date}.csv`;
}
