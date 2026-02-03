'use client';

import { User, Globe, Twitter, Facebook, Instagram, Star, Check } from 'lucide-react';
import { RaceSection } from './RaceSection';
import type { VoterGuide, BallotData } from '@/types';

interface PublicGuideViewProps {
  guide: VoterGuide;
  ballot: BallotData;
}

export function PublicGuideView({ guide, ballot }: PublicGuideViewProps) {
  // Filter to only show races where there's at least one recommendation
  const racesWithRecommendations = ballot.races.filter(race =>
    race.candidates.some(candidate =>
      guide.recommendations.some(
        r => r.raceId === race.id && r.candidateId === candidate.id && r.status !== 'none'
      )
    )
  );

  // Also include races without recommendations but show them collapsed
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
            <p className="text-blue-200 text-sm font-medium mb-1">Voter Guide</p>
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

      {/* Quick Summary - Top Picks and Yes recommendations */}
      {racesWithRecommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Summary</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {racesWithRecommendations.map(race => {
              const topPicks = race.candidates.filter(c => {
                const rec = guide.recommendations.find(
                  r => r.raceId === race.id && r.candidateId === c.id
                );
                return rec && rec.status === 'top_pick';
              });

              const yesRecs = race.candidates.filter(c => {
                const rec = guide.recommendations.find(
                  r => r.raceId === race.id && r.candidateId === c.id
                );
                return rec && rec.status === 'yes';
              });

              if (topPicks.length === 0 && yesRecs.length === 0) return null;

              const raceName = race.district ? `${race.name} - ${race.district}` : race.name;

              return (
                <div key={race.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{raceName}</span>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {topPicks.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          <Star className="w-3 h-3" fill="currentColor" />
                          {c.name}
                        </span>
                      ))}
                      {yesRecs.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <Check className="w-3 h-3" />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
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
            const hasRecommendations = race.candidates.some(c =>
              guide.recommendations.some(
                r => r.raceId === race.id && r.candidateId === c.id && r.status !== 'none'
              )
            );

            return (
              <RaceSection
                key={race.id}
                race={race}
                guide={guide}
                isEditing={false}
                defaultExpanded={hasRecommendations && index < 3}
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
          The recommendations in this guide represent the personal opinions of {guide.authorName}.
        </p>
      </div>
    </div>
  );
}
