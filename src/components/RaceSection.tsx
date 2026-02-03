'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import type { Race, VoterGuide, CandidateRecommendation } from '@/types';
import { getRecommendation } from '@/lib/storage';

interface RaceSectionProps {
  race: Race;
  guide?: VoterGuide;
  onRecommendationChange?: (recommendation: CandidateRecommendation) => void;
  isEditing?: boolean;
  defaultExpanded?: boolean;
}

export function RaceSection({
  race,
  guide,
  onRecommendationChange,
  isEditing = false,
  defaultExpanded = false,
}: RaceSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const recommendedCount = guide
    ? race.candidates.filter(c => {
        const recommendation = getRecommendation(guide, race.id, c.id);
        return recommendation && recommendation.status !== 'none';
      }).length
    : 0;

  const raceName = race.district ? `${race.name} - ${race.district}` : race.name;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
          <h3 className="font-semibold text-gray-900">{raceName}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{race.candidates.length} candidate{race.candidates.length !== 1 ? 's' : ''}</span>
          {recommendedCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {recommendedCount} rated
            </span>
          )}
        </div>
      </button>

      {/* Candidates */}
      {expanded && (
        <div className="p-4 space-y-4">
          {race.description && (
            <p className="text-sm text-gray-600 mb-4">{race.description}</p>
          )}
          {race.candidates.map(candidate => {
            const recommendation = guide ? getRecommendation(guide, race.id, candidate.id) : undefined;
            return (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                raceId={race.id}
                recommendation={recommendation}
                onRecommendationChange={onRecommendationChange}
                isEditing={isEditing}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
