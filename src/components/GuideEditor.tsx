'use client';

import { useState, useEffect } from 'react';
import { Save, Eye, Share2 } from 'lucide-react';
import { RaceSection } from './RaceSection';
import type { VoterGuide, BallotData, CandidateEndorsement } from '@/types';
import { saveGuide, updateEndorsement } from '@/lib/storage';

interface GuideEditorProps {
  guide: VoterGuide;
  ballot: BallotData;
  onGuideUpdate: (guide: VoterGuide) => void;
}

export function GuideEditor({ guide, ballot, onGuideUpdate }: GuideEditorProps) {
  const [localGuide, setLocalGuide] = useState<VoterGuide>(guide);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    setLocalGuide(guide);
  }, [guide]);

  const handleEndorsementChange = (endorsement: CandidateEndorsement) => {
    const updatedGuide = updateEndorsement(localGuide.id, endorsement);
    if (updatedGuide) {
      setLocalGuide(updatedGuide);
      onGuideUpdate(updatedGuide);
      setLastSaved(new Date());
    }
  };

  const handleGuideInfoChange = (field: keyof VoterGuide, value: string | boolean) => {
    const updatedGuide = {
      ...localGuide,
      [field]: value,
    };
    setLocalGuide(updatedGuide);
  };

  const handleSave = () => {
    setIsSaving(true);
    const saved = saveGuide(localGuide);
    setLocalGuide(saved);
    onGuideUpdate(saved);
    setLastSaved(new Date());
    setIsSaving(false);
  };

  const previewUrl = `/guide/${localGuide.id}`;

  return (
    <div className="space-y-6">
      {/* Guide Info Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Guide Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guide Name
            </label>
            <input
              type="text"
              value={localGuide.name}
              onChange={(e) => handleGuideInfoChange('name', e.target.value)}
              placeholder="e.g., My 2025 Voter Guide"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author Name
            </label>
            <input
              type="text"
              value={localGuide.authorName}
              onChange={(e) => handleGuideInfoChange('authorName', e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author Bio (optional)
            </label>
            <textarea
              value={localGuide.authorBio || ''}
              onChange={(e) => handleGuideInfoChange('authorBio', e.target.value)}
              placeholder="A brief description about yourself and why you're creating this guide..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author Photo URL (optional)
            </label>
            <input
              type="url"
              value={localGuide.authorPhoto || ''}
              onChange={(e) => handleGuideInfoChange('authorPhoto', e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localGuide.isPublished}
                onChange={(e) => handleGuideInfoChange('isPublished', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Publish this guide</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Guide'}
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </a>

          {localGuide.isPublished && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + previewUrl);
                alert('Link copied to clipboard!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Copy Share Link
            </button>
          )}

          {lastSaved && (
            <span className="self-center text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Races Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Races & Candidates
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Click on a race to expand it and add your endorsements. You don&apos;t need to endorse every candidate or every race.
        </p>

        <div className="space-y-3">
          {ballot.races.map((race, index) => (
            <RaceSection
              key={race.id}
              race={race}
              guide={localGuide}
              onEndorsementChange={handleEndorsementChange}
              isEditing={true}
              defaultExpanded={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
