'use client';

import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { Race, Candidate, BallotData, CandidateCSVRow } from '@/types';

export interface ParseResult {
  success: boolean;
  ballot?: BallotData;
  errors?: string[];
}

export function parseCSV(csvContent: string, ballotName: string): ParseResult {
  const errors: string[] = [];

  const result = Papa.parse<CandidateCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
  });

  if (result.errors.length > 0) {
    return {
      success: false,
      errors: result.errors.map(e => `Row ${e.row}: ${e.message}`),
    };
  }

  const racesMap = new Map<string, Race>();

  result.data.forEach((row, index) => {
    if (!row.candidate_name) {
      errors.push(`Row ${index + 2}: Missing candidate name`);
      return;
    }

    if (!row.race_name) {
      errors.push(`Row ${index + 2}: Missing race name`);
      return;
    }

    const raceKey = `${row.race_name}${row.race_district ? `-${row.race_district}` : ''}`;

    let race = racesMap.get(raceKey);
    if (!race) {
      race = {
        id: uuidv4(),
        name: row.race_name,
        district: row.race_district || undefined,
        order: row.race_order ? parseInt(row.race_order, 10) : racesMap.size,
        candidates: [],
      };
      racesMap.set(raceKey, race);
    }

    const candidate: Candidate = {
      id: uuidv4(),
      name: row.candidate_name,
      party: row.candidate_party || undefined,
      title: row.candidate_title || undefined,
      photoUrl: row.candidate_photo_url || undefined,
      website: row.candidate_website || undefined,
      twitter: row.candidate_twitter || undefined,
      facebook: row.candidate_facebook || undefined,
      instagram: row.candidate_instagram || undefined,
    };

    race.candidates.push(candidate);
  });

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const races = Array.from(racesMap.values()).sort((a, b) => a.order - b.order);

  const ballot: BallotData = {
    id: uuidv4(),
    name: ballotName,
    races,
  };

  return { success: true, ballot };
}

export function generateSampleCSV(): string {
  const headers = [
    'race_name',
    'race_district',
    'race_order',
    'candidate_name',
    'candidate_party',
    'candidate_title',
    'candidate_photo_url',
    'candidate_website',
    'candidate_twitter',
    'candidate_facebook',
    'candidate_instagram',
  ];

  const sampleData = [
    ['City Mayor', '', '1', 'Jane Smith', 'Democrat', 'Current Council Member', '', 'https://janesmith.com', '@janesmith', '', ''],
    ['City Mayor', '', '1', 'John Doe', 'Republican', 'Business Owner', '', 'https://johndoe.com', '@johndoe', '', ''],
    ['City Council', 'District 1', '2', 'Alice Johnson', 'Democrat', 'Community Organizer', '', '', '@alicejohnson', '', ''],
    ['City Council', 'District 1', '2', 'Bob Wilson', 'Republican', 'Attorney', '', '', '', '', ''],
    ['School Board', 'District 3', '3', 'Carol Davis', 'Nonpartisan', 'Educator', '', '', '', '', ''],
  ];

  const csv = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
  return csv;
}
