'use client';

import { v4 as uuidv4 } from 'uuid';
import type { VoterGuide, BallotData, CandidateEndorsement } from '@/types';

const STORAGE_KEYS = {
  BALLOT: 'voter_guide_ballot',
  GUIDES: 'voter_guides',
  CURRENT_GUIDE: 'current_guide_id',
};

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
  return data ? JSON.parse(data) : [];
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
    endorsements: [],
  };
  return saveGuide(guide);
}

export function deleteGuide(id: string): void {
  const guides = getAllGuides().filter(g => g.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(guides));
  }
}

export function updateEndorsement(
  guideId: string,
  endorsement: CandidateEndorsement
): VoterGuide | null {
  const guide = getGuideById(guideId);
  if (!guide) return null;

  const existingIndex = guide.endorsements.findIndex(
    e => e.candidateId === endorsement.candidateId && e.raceId === endorsement.raceId
  );

  if (existingIndex >= 0) {
    guide.endorsements[existingIndex] = endorsement;
  } else {
    guide.endorsements.push(endorsement);
  }

  return saveGuide(guide);
}

export function getEndorsement(
  guide: VoterGuide,
  raceId: string,
  candidateId: string
): CandidateEndorsement | undefined {
  return guide.endorsements.find(
    e => e.raceId === raceId && e.candidateId === candidateId
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
