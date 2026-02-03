'use client';

import { v4 as uuidv4 } from 'uuid';
import type { VoterGuide, BallotData, CandidateRecommendation, RecommendationStatus } from '@/types';

const STORAGE_KEYS = {
  BALLOT: 'voter_guide_ballot',
  GUIDES: 'voter_guides',
  CURRENT_GUIDE: 'current_guide_id',
};

// Map old status values to new ones
function migrateStatus(oldStatus: string): RecommendationStatus {
  const statusMap: Record<string, RecommendationStatus> = {
    'support': 'yes',
    'oppose': 'no',
    'neutral': 'none',
    'none': 'none',
    'top_pick': 'top_pick',
    'yes': 'yes',
    'no': 'no',
    'strong_no': 'strong_no',
  };
  return statusMap[oldStatus] || 'none';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyGuide = any;

// Migrate old guide data to new format
function migrateGuide(guide: LegacyGuide): VoterGuide {
  // If guide has old 'endorsements' field, migrate to 'recommendations'
  if ('endorsements' in guide && !('recommendations' in guide)) {
    const endorsements = guide.endorsements || [];
    const recommendations = endorsements.map((e: LegacyGuide) => ({
      ...e,
      status: migrateStatus(e.status),
    }));

    // Create new guide without endorsements field
    const { endorsements: _, ...restGuide } = guide;
    return {
      ...restGuide,
      recommendations,
    } as VoterGuide;
  }

  // Ensure recommendations array exists and migrate any old statuses
  const recommendations = (guide.recommendations || []).map((r: LegacyGuide) => ({
    ...r,
    status: migrateStatus(r.status),
  }));

  return {
    ...guide,
    recommendations,
  };
}

// Ballot Data Management
export function saveBallotData(ballot: BallotData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.BALLOT, JSON.stringify(ballot));
}

export function getBallotData(): BallotData | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.BALLOT);
  return data ? JSON.parse(data) : null;
}

export function clearBallotData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.BALLOT);
}

// Voter Guide Management
export function getAllGuides(): VoterGuide[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.GUIDES);
  if (!data) return [];

  const rawGuides = JSON.parse(data);
  const migratedGuides = rawGuides.map(migrateGuide);

  // Save migrated data back to localStorage if any changes were made
  const needsMigration = rawGuides.some((g: LegacyGuide) =>
    'endorsements' in g && !('recommendations' in g)
  );
  if (needsMigration) {
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(migratedGuides));
  }

  return migratedGuides;
}

export function getGuideById(id: string): VoterGuide | null {
  const guides = getAllGuides();
  return guides.find(g => g.id === id) || null;
}

export function saveGuide(guide: VoterGuide): VoterGuide {
  const guides = getAllGuides();
  const existingIndex = guides.findIndex(g => g.id === guide.id);

  const updatedGuide = {
    ...guide,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    guides[existingIndex] = updatedGuide;
  } else {
    guides.push(updatedGuide);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(guides));
  }
  return updatedGuide;
}

export function createNewGuide(name: string, authorName: string): VoterGuide {
  const now = new Date().toISOString();
  const guide: VoterGuide = {
    id: uuidv4(),
    name,
    authorName,
    createdAt: now,
    updatedAt: now,
    isPublished: false,
    recommendations: [],
  };
  return saveGuide(guide);
}

export function deleteGuide(id: string): void {
  const guides = getAllGuides().filter(g => g.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(guides));
  }
}

export function updateRecommendation(
  guideId: string,
  recommendation: CandidateRecommendation
): VoterGuide | null {
  const guide = getGuideById(guideId);
  if (!guide) return null;

  const existingIndex = guide.recommendations.findIndex(
    r => r.candidateId === recommendation.candidateId && r.raceId === recommendation.raceId
  );

  if (existingIndex >= 0) {
    guide.recommendations[existingIndex] = recommendation;
  } else {
    guide.recommendations.push(recommendation);
  }

  return saveGuide(guide);
}

export function getRecommendation(
  guide: VoterGuide,
  raceId: string,
  candidateId: string
): CandidateRecommendation | undefined {
  return guide.recommendations.find(
    r => r.raceId === raceId && r.candidateId === candidateId
  );
}

// Current Guide Session
export function setCurrentGuideId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_GUIDE, id);
}

export function getCurrentGuideId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_GUIDE);
}
