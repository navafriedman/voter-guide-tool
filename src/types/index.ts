export type RecommendationStatus = 'top_pick' | 'yes' | 'no' | 'strong_no' | 'none';

export interface Candidate {
  id: string;
  name: string;
  party?: string;
  title?: string;
  photoUrl?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
}

export interface Race {
  id: string;
  name: string;
  description?: string;
  district?: string;
  order: number;
  candidates: Candidate[];
}

export interface CandidateRecommendation {
  candidateId: string;
  raceId: string;
  status: RecommendationStatus;
  reason?: string;
}

export interface SkippedCandidate {
  raceId: string;
  candidateId: string;
}

export interface VoterGuide {
  id: string;
  name: string;
  authorName: string;
  authorPhoto?: string;
  authorBio?: string;
  ballotName?: string;
  ballotLocation?: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  recommendations: CandidateRecommendation[];
  skippedRaces?: string[];
  skippedCandidates?: SkippedCandidate[];
  socialLinks?: {
    website?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface BallotData {
  id: string;
  name: string;
  location?: string;
  races: Race[];
}

// CSV Import types
export interface CandidateCSVRow {
  race: string;
  candidate: string;
  district?: string;
  order?: string;
  party?: string;
  title?: string;
  photo_url?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
}
