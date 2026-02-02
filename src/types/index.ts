export type EndorsementStatus = 'support' | 'oppose' | 'neutral' | 'none';

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

export interface CandidateEndorsement {
  candidateId: string;
  raceId: string;
  status: EndorsementStatus;
  reason?: string;
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
  endorsements: CandidateEndorsement[];
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
  race_name: string;
  race_district?: string;
  race_order?: string;
  candidate_name: string;
  candidate_party?: string;
  candidate_title?: string;
  candidate_photo_url?: string;
  candidate_website?: string;
  candidate_twitter?: string;
  candidate_facebook?: string;
  candidate_instagram?: string;
}
