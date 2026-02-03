'use client';

import { useState, useEffect } from 'react';
import { Star, Check, X, Ban, User, Globe, Twitter, Facebook, Instagram, ChevronDown, ChevronUp, SkipForward, RotateCcw, MessageSquare } from 'lucide-react';
import type { Candidate, CandidateRecommendation, RecommendationStatus } from '@/types';

interface CandidateCardProps {
  candidate: Candidate;
  raceId: string;
  recommendation?: CandidateRecommendation;
  onRecommendationChange?: (recommendation: CandidateRecommendation) => void;
  isEditing?: boolean;
  isSkipped?: boolean;
  onSkipToggle?: (skip: boolean) => void;
}

const statusColors: Record<RecommendationStatus, string> = {
  top_pick: 'border-purple-500 bg-purple-50',
  yes: 'border-green-500 bg-green-50',
  no: 'border-orange-500 bg-orange-50',
  strong_no: 'border-red-500 bg-red-50',
  none: 'border-gray-200 bg-white',
};

const statusLabels: Record<RecommendationStatus, string> = {
  top_pick: 'Top Pick',
  yes: 'Yes',
  no: 'No',
  strong_no: 'Strong No',
  none: 'No Designation',
};

const statusButtonStyles: Record<RecommendationStatus, { active: string; inactive: string }> = {
  top_pick: { active: 'bg-purple-500 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-purple-100' },
  yes: { active: 'bg-green-500 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-green-100' },
  no: { active: 'bg-orange-500 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-orange-100' },
  strong_no: { active: 'bg-red-500 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-red-100' },
  none: { active: 'bg-gray-200 text-gray-600', inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
};

const StatusIcon = ({ status, className }: { status: RecommendationStatus; className?: string }) => {
  switch (status) {
    case 'top_pick':
      return <Star className={className} fill="currentColor" />;
    case 'yes':
      return <Check className={className} />;
    case 'no':
      return <X className={className} />;
    case 'strong_no':
      return <Ban className={className} />;
    default:
      return null;
  }
};

const statusIconColors: Record<RecommendationStatus, string> = {
  top_pick: 'text-purple-500',
  yes: 'text-green-500',
  no: 'text-orange-500',
  strong_no: 'text-red-500',
  none: '',
};

export function CandidateCard({
  candidate,
  raceId,
  recommendation,
  onRecommendationChange,
  isEditing = false,
  isSkipped = false,
  onSkipToggle,
}: CandidateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState(recommendation?.reason || '');
  const status = recommendation?.status || 'none';

  // Auto-expand when a status is selected
  useEffect(() => {
    if (status !== 'none' && isEditing) {
      setExpanded(true);
    }
  }, [status, isEditing]);

  // If skipped, show a simplified view
  if (isSkipped && isEditing) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkipForward className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500">{candidate.name}</span>
            <span className="text-xs text-gray-400">Skipped</span>
          </div>
          {onSkipToggle && (
            <button
              onClick={() => onSkipToggle(false)}
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

  const handleStatusChange = (newStatus: RecommendationStatus) => {
    if (!onRecommendationChange) return;
    onRecommendationChange({
      candidateId: candidate.id,
      raceId,
      status: newStatus,
      reason,
    });
  };

  const handleReasonChange = (newReason: string) => {
    setReason(newReason);
    if (!onRecommendationChange) return;
    onRecommendationChange({
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

        {/* Recommendation Status Indicator (view mode) */}
        {!isEditing && status !== 'none' && (
          <div className={`flex-shrink-0 flex items-center gap-1 ${statusIconColors[status]}`}>
            <StatusIcon status={status} className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Recommendation Reason (view mode) */}
      {!isEditing && recommendation?.reason && (
        <div className="mt-3 pl-20">
          <p className="text-sm text-gray-700 italic">&ldquo;{recommendation.reason}&rdquo;</p>
        </div>
      )}

      {/* Editing Controls */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {status === 'none' ? 'Add recommendation' : `Edit recommendation (${statusLabels[status]})`}
            </button>
            {onSkipToggle && (
              <button
                onClick={() => onSkipToggle(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <SkipForward className="w-3 h-3" />
                Skip
              </button>
            )}
          </div>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Status Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('top_pick')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    status === 'top_pick' ? statusButtonStyles.top_pick.active : statusButtonStyles.top_pick.inactive
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Top Pick
                </button>
                <button
                  onClick={() => handleStatusChange('yes')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    status === 'yes' ? statusButtonStyles.yes.active : statusButtonStyles.yes.inactive
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Yes
                </button>
                <button
                  onClick={() => handleStatusChange('no')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    status === 'no' ? statusButtonStyles.no.active : statusButtonStyles.no.inactive
                  }`}
                >
                  <X className="w-4 h-4" />
                  No
                </button>
                <button
                  onClick={() => handleStatusChange('strong_no')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    status === 'strong_no' ? statusButtonStyles.strong_no.active : statusButtonStyles.strong_no.inactive
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  Strong No
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

              {/* Commentary Input */}
              {status !== 'none' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Add your commentary (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => handleReasonChange(e.target.value)}
                    placeholder="Why are you making this recommendation? Your explanation will be shown to viewers of your guide..."
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    rows={3}
                  />
                  {!reason && (
                    <p className="text-xs text-blue-600 mt-1">
                      Adding commentary helps readers understand your reasoning.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
