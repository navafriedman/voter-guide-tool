'use client';

import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { Race, Candidate, BallotData, CandidateCSVRow } from '@/types';

export interface ParseResult {
  success: boolean;
  ballot?: BallotData;
  errors?: string[];
}

// Map alternative column names to our standard names
const COLUMN_ALIASES: Record<string, string> = {
  // Race aliases
  'position_title': 'race',
  'position': 'race',
  'race_name': 'race',
  'office': 'race',
  'office_name': 'race',

  // Candidate aliases
  'candidate_full_name': 'candidate',
  'candidate_name': 'candidate',
  'full_name': 'candidate',
  'name': 'candidate',

  // District aliases
  'race_district': 'district',

  // Order aliases
  'race_order': 'order',
  'sort_order': 'order',

  // Party aliases
  'candidate_party': 'party',
  'party_affiliation': 'party',
  'political_party': 'party',

  // Title aliases
  'candidate_title': 'title',
  'occupation': 'title',
  'job_title': 'title',

  // Photo aliases
  'candidate_photo_url': 'photo_url',
  'photo': 'photo_url',
  'image': 'photo_url',
  'image_url': 'photo_url',
  'headshot': 'photo_url',

  // Website aliases
  'candidate_website': 'website',
  'url': 'website',
  'campaign_website': 'website',

  // Social aliases
  'candidate_twitter': 'twitter',
  'twitter_handle': 'twitter',
  'candidate_facebook': 'facebook',
  'facebook_url': 'facebook',
  'candidate_instagram': 'instagram',
  'instagram_handle': 'instagram',
};

function normalizeHeader(header: string): string {
  const normalized = header.toLowerCase().trim().replace(/\s+/g, '_');
  return COLUMN_ALIASES[normalized] || normalized;
}

export function parseCSV(csvContent: string, ballotName: string): ParseResult {
  const errors: string[] = [];

  const result = Papa.parse<CandidateCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  if (result.errors.length > 0) {
    return {
      success: false,
      errors: result.errors.map(e => `Row ${e.row}: ${e.message}`),
    };
  }

  const racesMap = new Map<string, Race>();

  result.data.forEach((row, index) => {
    if (!row.race) {
      errors.push(`Row ${index + 2}: Missing race`);
      return;
    }

    if (!row.candidate) {
      errors.push(`Row ${index + 2}: Missing candidate`);
      return;
    }

    const raceKey = `${row.race}${row.district ? `-${row.district}` : ''}`;

    let race = racesMap.get(raceKey);
    if (!race) {
      race = {
        id: uuidv4(),
        name: row.race,
        district: row.district || undefined,
        order: row.order ? parseInt(row.order, 10) : racesMap.size,
        candidates: [],
      };
      racesMap.set(raceKey, race);
    }

    const candidate: Candidate = {
      id: uuidv4(),
      name: row.candidate,
      party: row.party || undefined,
      title: row.title || undefined,
      photoUrl: row.photo_url || undefined,
      website: row.website || undefined,
      twitter: row.twitter || undefined,
      facebook: row.facebook || undefined,
      instagram: row.instagram || undefined,
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
    'race',
    'candidate',
    'district',
    'order',
    'party',
    'title',
    'photo_url',
    'website',
    'twitter',
    'facebook',
    'instagram',
  ];

  const sampleData = [
    ['City Mayor', 'Jane Smith', '', '1', 'Democrat', 'Current Council Member', '', 'https://janesmith.com', '@janesmith', '', ''],
    ['City Mayor', 'John Doe', '', '1', 'Republican', 'Business Owner', '', 'https://johndoe.com', '@johndoe', '', ''],
    ['City Council', 'Alice Johnson', 'District 1', '2', 'Democrat', 'Community Organizer', '', '', '@alicejohnson', '', ''],
    ['City Council', 'Bob Wilson', 'District 1', '2', 'Republican', 'Attorney', '', '', '', '', ''],
    ['School Board', 'Carol Davis', 'District 3', '3', 'Nonpartisan', 'Educator', '', '', '', '', ''],
  ];

  const csv = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
  return csv;
}
