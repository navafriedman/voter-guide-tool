'use client';

import { User, Globe, Twitter, Facebook, Instagram } from 'lucide-react';
import { RaceSection } from './RaceSection';
import type { VoterGuide, BallotData } from '@/types';

interface PublicGuideViewProps {
  guide: VoterGuide;
  ballot: BallotData;
}

export function PublicGuideView({ guide, ballot }: PublicGuideViewProps) {
  // Filter to only show races where there's at least one endorsement
  const racesWithEndorsements = ballot.races.filter(race =>
    race.candidates.some(candidate =>
      guide.endorsements.some(
        e => e.raceId === race.id && e.candidateId === candidate.id && e.status !== 'none'
      )
    )
  );

  // Also include races without endorsements but show them collapsed
  const allRaces = ballot.races;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-start gap-4">
          {guide.authorPhoto ? (
            <img
              src={guide.authorPhoto}
              alt={guide.authorName}
              className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-10 h-10 text-white/70" />
            </div>
          )}
          <div className="flex-grow">
            <p className="text-blue-200 text-sm font-medium mb-1">Local Voter Guide</p>
            <h1 className="text-2xl font-bold">{guide.name}</h1>
            <p className="text-blue-100 mt-1">by {guide.authorName}</p>
          </div>
        </div>

        {guide.authorBio && (
          <p className="mt-4 text-blue-100 text-sm leading-relaxed">{guide.authorBio}</p>
        )}

        {guide.socialLinks && (
          <div className="mt-4 flex gap-3">
            {guide.socialLinks.website && (
              <a href={guide.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">
                <Globe className="w-5 h-5" />
              </a>
            )}
            {guide.socialLinks.twitter && (
              <a href={`https://twitter.com/${guide.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {guide.socialLinks.facebook && (
              <a href={guide.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {guide.socialLinks.instagram && (
              <a href={`https://instagram.com/${guide.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">
                <Instagram className="w-5 h-5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Ballot Info */}
      {guide.ballotName && (
        <div className="bg-gray-100 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Ballot:</span> {guide.ballotName}
            {guide.ballotLocation && <span> • {guide.ballotLocation}</span>}
          </p>
        </div>
      )}

      {/* Quick Summary */}
      {racesWithEndorsements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Summary</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {racesWithEndorsements.map(race => {
              const endorsedCandidates = race.candidates.filter(c => {
                const endorsement = guide.endorsements.find(
                  e => e.raceId === race.id && e.candidateId === c.id
                );
                return endorsement && endorsement.status === 'support';
              });

              if (endorsedCandidates.length === 0) return null;

              const raceName = race.district ? `${race.name} - ${race.district}` : race.name;

              return (
                <div key={race.id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{raceName}</span>
                  <span className="font-medium text-gray-900">
                    {endorsedCandidates.map(c => c.name).join(', ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Races */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Races</h2>
        <div className="space-y-3">
          {allRaces.map((race, index) => {
            const hasEndorsements = race.candidates.some(c =>
              guide.endorsements.some(
                e => e.raceId === race.id && e.candidateId === c.id && e.status !== 'none'
              )
            );

            return (
              <RaceSection
                key={race.id}
                race={race}
                guide={guide}
                isEditing={false}
                defaultExpanded={hasEndorsements && index < 3}
              />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          This voter guide was created using the Voter Guide Tool.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          The endorsements in this guide represent the personal opinions of {guide.authorName}.
        </p>
      </div>
    </div>
  );
}
