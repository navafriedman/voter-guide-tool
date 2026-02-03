'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users, SkipForward, RotateCcw, UserCheck } from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import type { Race, VoterGuide, CandidateRecommendation } from '@/types';
import { getRecommendation, isRaceSkipped, isCandidateSkipped } from '@/lib/storage';

interface RaceSectionProps {
  race: Race;
  guide?: VoterGuide;
  onRecommendationChange?: (recommendation: CandidateRecommendation) => void;
  onSkipRace?: (skip: boolean) => void;
  onSkipCandidate?: (candidateId: string, skip: boolean) => void;
  isEditing?: boolean;
  defaultExpanded?: boolean;
}

export function RaceSection({
  race,
  guide,
  onRecommendationChange,
  onSkipRace,
  onSkipCandidate,
  isEditing = false,
  defaultExpanded = false,
}: RaceSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const raceIsSkipped = guide ? isRaceSkipped(guide, race.id) : false;

  // Count non-skipped candidates with recommendations
  const recommendedCount = guide
    ? race.candidates.filter(c => {
        if (isCandidateSkipped(guide, race.id, c.id)) return false;
        const recommendation = getRecommendation(guide, race.id, c.id);
        return recommendation && recommendation.status !== 'none';
      }).length
    : 0;

  const skippedCandidateCount = guide
    ? race.candidates.filter(c => isCandidateSkipped(guide, race.id, c.id)).length
    : 0;

  const raceName = race.district ? `${race.name} - ${race.district}` : race.name;
  const isUncontested = race.candidates.length === 1;

  // Show simplified view for skipped races in editing mode
  if (raceIsSkipped && isEditing) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 opacity-60">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkipForward className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-500">{raceName}</h3>
            <span className="text-xs text-gray-400">Skipped</span>
          </div>
          {onSkipRace && (
            <button
              onClick={() => onSkipRace(false)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Bring Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center bg-gray-50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-grow px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
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
            {isUncontested ? (
              <>
                <UserCheck className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600 font-medium">Uncontested</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>{race.candidates.length} candidates</span>
              </>
            )}
            {recommendedCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {recommendedCount} rated
              </span>
            )}
            {skippedCandidateCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                {skippedCandidateCount} skipped
              </span>
            )}
          </div>
        </button>
        {isEditing && onSkipRace && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSkipRace(true);
            }}
            className="px-3 py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border-l border-gray-200"
            title="Skip this race"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Candidates */}
      {expanded && (
        <div className="p-4 space-y-4">
          {race.description && (
            <p className="text-sm text-gray-600 mb-4">{race.description}</p>
          )}
          {isUncontested && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-amber-700">
                <span className="font-medium">Uncontested race:</span> Only one candidate is running for this position.
              </p>
            </div>
          )}
          {race.candidates.map(candidate => {
            const recommendation = guide ? getRecommendation(guide, race.id, candidate.id) : undefined;
            const candidateIsSkipped = guide ? isCandidateSkipped(guide, race.id, candidate.id) : false;
            return (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                raceId={race.id}
                recommendation={recommendation}
                onRecommendationChange={onRecommendationChange}
                isEditing={isEditing}
                isSkipped={candidateIsSkipped}
                onSkipToggle={onSkipCandidate ? (skip) => onSkipCandidate(candidate.id, skip) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
