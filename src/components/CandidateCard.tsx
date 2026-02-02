'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus, User, Globe, Twitter, Facebook, Instagram, ChevronDown, ChevronUp } from 'lucide-react';
import type { Candidate, CandidateEndorsement, EndorsementStatus } from '@/types';

interface CandidateCardProps {
  candidate: Candidate;
  raceId: string;
  endorsement?: CandidateEndorsement;
  onEndorsementChange?: (endorsement: CandidateEndorsement) => void;
  isEditing?: boolean;
}

const statusColors: Record<EndorsementStatus, string> = {
  support: 'border-green-500 bg-green-50',
  oppose: 'border-red-500 bg-red-50',
  neutral: 'border-yellow-500 bg-yellow-50',
  none: 'border-gray-200 bg-white',
};

const statusButtonStyles: Record<EndorsementStatus, string> = {
  support: 'bg-green-500 text-white',
  oppose: 'bg-red-500 text-white',
  neutral: 'bg-yellow-500 text-white',
  none: 'bg-gray-200 text-gray-600',
};

export function CandidateCard({
  candidate,
  raceId,
  endorsement,
  onEndorsementChange,
  isEditing = false,
}: CandidateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState(endorsement?.reason || '');
  const status = endorsement?.status || 'none';

  const handleStatusChange = (newStatus: EndorsementStatus) => {
    if (!onEndorsementChange) return;
    onEndorsementChange({
      candidateId: candidate.id,
      raceId,
      status: newStatus,
      reason,
    });
  };

  const handleReasonChange = (newReason: string) => {
    setReason(newReason);
    if (!onEndorsementChange) return;
    onEndorsementChange({
      candidateId: candidate.id,
      raceId,
      status,
      reason: newReason,
    });
  };

  const hasSocialLinks = candidate.website || candidate.twitter || candidate.facebook || candidate.instagram;

  return (
    <div className={`rounded-lg border-2 p-4 transition-all ${statusColors[status]}`}>
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={candidate.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{candidate.name}</h4>
          {candidate.party && (
            <p className="text-sm text-gray-600">{candidate.party}</p>
          )}
          {candidate.title && (
            <p className="text-sm text-gray-500 italic">{candidate.title}</p>
          )}

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="flex gap-2 mt-2">
              {candidate.website && (
                <a href={candidate.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {candidate.twitter && (
                <a href={`https://twitter.com/${candidate.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {candidate.facebook && (
                <a href={candidate.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {candidate.instagram && (
                <a href={`https://instagram.com/${candidate.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Endorsement Status Indicator (view mode) */}
        {!isEditing && status !== 'none' && (
          <div className="flex-shrink-0">
            {status === 'support' && <ThumbsUp className="w-6 h-6 text-green-500" />}
            {status === 'oppose' && <ThumbsDown className="w-6 h-6 text-red-500" />}
            {status === 'neutral' && <Minus className="w-6 h-6 text-yellow-500" />}
          </div>
        )}
      </div>

      {/* Endorsement Reason (view mode) */}
      {!isEditing && endorsement?.reason && (
        <div className="mt-3 pl-20">
          <p className="text-sm text-gray-700 italic">&ldquo;{endorsement.reason}&rdquo;</p>
        </div>
      )}

      {/* Editing Controls */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {status === 'none' ? 'Add endorsement' : 'Edit endorsement'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Status Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange('support')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    status === 'support' ? statusButtonStyles.support : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Support
                </button>
                <button
                  onClick={() => handleStatusChange('oppose')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    status === 'oppose' ? statusButtonStyles.oppose : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Oppose
                </button>
                <button
                  onClick={() => handleStatusChange('neutral')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    status === 'neutral' ? statusButtonStyles.neutral : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Neutral
                </button>
                {status !== 'none' && (
                  <button
                    onClick={() => handleStatusChange('none')}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Reason Input */}
              {status !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Why? (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => handleReasonChange(e.target.value)}
                    placeholder="Explain your endorsement..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
