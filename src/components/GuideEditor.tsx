'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Eye, Share2, Upload, User, RotateCcw, SkipForward, Filter, Download, Image } from 'lucide-react';
import { RaceSection } from './RaceSection';
import type { VoterGuide, BallotData, CandidateRecommendation } from '@/types';
import { saveGuide, updateRecommendation, skipRace, unskipRace, skipCandidate, unskipCandidate, isRaceSkipped, isCandidateSkipped } from '@/lib/storage';
import { updateGuideApi, saveBallotApi, saveRecommendationApi, skipRaceApi, skipCandidateApi, trackWithSession } from '@/lib/api-client';
import { exportGuideToCSV, generateExportFilename } from '@/lib/csv-export';
import JSZip from 'jszip';

interface GuideEditorProps {
  guide: VoterGuide;
  ballot: BallotData;
  onGuideUpdate: (guide: VoterGuide) => void;
}

export function GuideEditor({ guide, ballot, onGuideUpdate }: GuideEditorProps) {
  const [localGuide, setLocalGuide] = useState<VoterGuide>(guide);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [partyFilter, setPartyFilter] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalGuide(guide);
  }, [guide]);

  // Extract unique parties from ballot
  const availableParties = useMemo(() => {
    const parties = new Set<string>();
    ballot.races.forEach(race => {
      race.candidates.forEach(c => {
        if (c.party) parties.add(c.party);
      });
    });
    return Array.from(parties).sort();
  }, [ballot]);

  // Filter races based on party (for primaries)
  const filteredRaces = useMemo(() => {
    if (!partyFilter) return ballot.races;
    return ballot.races
      .map(race => ({
        ...race,
        candidates: race.candidates.filter(c => c.party === partyFilter),
      }))
      .filter(race => race.candidates.length > 0);
  }, [ballot.races, partyFilter]);

  // Calculate progress (excluding skipped items, respecting party filter)
  const nonSkippedRaces = filteredRaces.filter(race => !isRaceSkipped(localGuide, race.id));
  const totalCandidates = nonSkippedRaces.reduce((sum, race) => {
    return sum + race.candidates.filter(c => !isCandidateSkipped(localGuide, race.id, c.id)).length;
  }, 0);
  const ratedCandidates = localGuide.recommendations.filter(r => {
    // Don't count recommendations for skipped races or candidates
    if (isRaceSkipped(localGuide, r.raceId)) return false;
    if (isCandidateSkipped(localGuide, r.raceId, r.candidateId)) return false;
    return r.status !== 'none';
  }).length;
  const progressPercent = totalCandidates > 0 ? Math.round((ratedCandidates / totalCandidates) * 100) : 0;
  const racesWithRatings = new Set(
    localGuide.recommendations
      .filter(r => r.status !== 'none' && !isRaceSkipped(localGuide, r.raceId))
      .map(r => r.raceId)
  ).size;

  // Count skipped items
  const skippedRacesCount = localGuide.skippedRaces?.length || 0;
  const skippedCandidatesCount = localGuide.skippedCandidates?.length || 0;

  const handleRecommendationChange = async (recommendation: CandidateRecommendation) => {
    // Save to localStorage first (instant feedback)
    const updatedGuide = updateRecommendation(localGuide.id, recommendation);
    if (updatedGuide) {
      setLocalGuide(updatedGuide);
      onGuideUpdate(updatedGuide);
      setLastSaved(new Date());

      // Sync to database in background
      try {
        await saveRecommendationApi(localGuide.id, recommendation);
      } catch (error) {
        console.warn('Failed to sync recommendation to database:', error);
      }
    }
  };

  const handleSkipRace = async (raceId: string, skip: boolean) => {
    // Save to localStorage first (instant feedback)
    const updatedGuide = skip
      ? skipRace(localGuide.id, raceId)
      : unskipRace(localGuide.id, raceId);
    if (updatedGuide) {
      setLocalGuide(updatedGuide);
      onGuideUpdate(updatedGuide);
      setLastSaved(new Date());

      // Sync to database in background
      try {
        await skipRaceApi(localGuide.id, raceId, skip);
      } catch (error) {
        console.warn('Failed to sync skip race to database:', error);
      }
    }
  };

  const handleSkipCandidate = async (raceId: string, candidateId: string, skip: boolean) => {
    // Save to localStorage first (instant feedback)
    const updatedGuide = skip
      ? skipCandidate(localGuide.id, raceId, candidateId)
      : unskipCandidate(localGuide.id, raceId, candidateId);
    if (updatedGuide) {
      setLocalGuide(updatedGuide);
      onGuideUpdate(updatedGuide);
      setLastSaved(new Date());

      // Sync to database in background
      try {
        await skipCandidateApi(localGuide.id, raceId, candidateId, skip);
      } catch (error) {
        console.warn('Failed to sync skip candidate to database:', error);
      }
    }
  };

  const handleGuideInfoChange = (field: keyof VoterGuide, value: string | boolean) => {
    const updatedGuide = {
      ...localGuide,
      [field]: value,
    };
    setLocalGuide(updatedGuide);
  };

  // Compress and resize image to reduce size
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress to max 200px width, 80% quality for profile photo
    const compressed = await compressImage(file, 200, 0.8);
    handleGuideInfoChange('authorPhoto', compressed);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress to max 1200px width, 80% quality for banner
    const compressed = await compressImage(file, 1200, 0.8);
    handleGuideInfoChange('bannerPhoto', compressed);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    // Ensure ballot has an ID (migration for old ballots)
    const ballotToSave = {
      ...ballot,
      id: ballot.id || crypto.randomUUID(),
    };

    // Ensure guide has ballotId linked
    const guideToSave = {
      ...localGuide,
      ballotId: ballotToSave.id,
    };

    // Save to localStorage first (instant feedback)
    const saved = saveGuide(guideToSave);
    setLocalGuide(saved);
    onGuideUpdate(saved);
    setLastSaved(new Date());

    // Sync to database in background with timeout
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sync timeout')), 15000)
      );

      const syncPromise = (async () => {
        // Save ballot first (so it exists when guide references it)
        await saveBallotApi(ballotToSave);
        // Then save/update the guide
        await updateGuideApi(guideToSave.id, guideToSave);
        trackWithSession('guide_saved', { guideId: guideToSave.id });
      })();

      await Promise.race([syncPromise, timeoutPromise]);
      setSaveMessage({ type: 'success', text: 'Guide saved and synced to cloud!' });
    } catch (error) {
      console.warn('Failed to sync guide to database:', error);
      setSaveMessage({ type: 'warning', text: 'Saved locally. Cloud sync failed - try again later.' });
    }

    setIsSaving(false);

    // Clear message after 5 seconds
    setTimeout(() => setSaveMessage(null), 5000);
  };

  // Convert base64 data URL to blob
  const dataURLToBlob = (dataURL: string): Blob => {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleDownload = async () => {
    const zip = new JSZip();

    // Add CSV file
    const csv = exportGuideToCSV(localGuide, ballot);
    zip.file('voter-guide.csv', csv);

    // Add profile photo if exists
    if (localGuide.authorPhoto && localGuide.authorPhoto.startsWith('data:')) {
      const profileBlob = dataURLToBlob(localGuide.authorPhoto);
      const ext = localGuide.authorPhoto.includes('image/png') ? 'png' : 'jpg';
      zip.file(`profile.${ext}`, profileBlob);
    }

    // Add banner photo if exists
    if (localGuide.bannerPhoto && localGuide.bannerPhoto.startsWith('data:')) {
      const bannerBlob = dataURLToBlob(localGuide.bannerPhoto);
      const ext = localGuide.bannerPhoto.includes('image/png') ? 'png' : 'jpg';
      zip.file(`banner.${ext}`, bannerBlob);
    }

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const filename = generateExportFilename(localGuide.name).replace('.csv', '.zip');
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    trackWithSession('guide_exported', { guideId: localGuide.id, metadata: { format: 'zip' } });
  };

  const previewUrl = `/guide/${localGuide.id}`;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Your Progress</h3>
          <span className="text-sm text-gray-500">
            {ratedCandidates} of {totalCandidates} candidates rated ({racesWithRatings} of {nonSkippedRaces.length} races)
            {(skippedRacesCount > 0 || skippedCandidatesCount > 0) && (
              <span className="ml-2 text-gray-400">
                • {skippedRacesCount > 0 && `${skippedRacesCount} race${skippedRacesCount !== 1 ? 's' : ''} skipped`}
                {skippedRacesCount > 0 && skippedCandidatesCount > 0 && ', '}
                {skippedCandidatesCount > 0 && `${skippedCandidatesCount} candidate${skippedCandidatesCount !== 1 ? 's' : ''} skipped`}
              </span>
            )}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          You don&apos;t need to rate every candidate - focus on the races you care about most. Use Skip to hide items you want to review later.
        </p>
      </div>

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
              Your Photo (optional)
            </label>
            <div className="flex items-center gap-4">
              {localGuide.authorPhoto ? (
                <img
                  src={localGuide.authorPhoto}
                  alt="Author"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-grow">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
                {localGuide.authorPhoto && (
                  <button
                    onClick={() => handleGuideInfoChange('authorPhoto', '')}
                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Photo (optional)
            </label>
            <div className="space-y-3">
              {localGuide.bannerPhoto ? (
                <div className="relative">
                  <img
                    src={localGuide.bannerPhoto}
                    alt="Banner"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => handleGuideInfoChange('bannerPhoto', '')}
                    className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">No banner image</span>
                  </div>
                </div>
              )}
              <div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {localGuide.bannerPhoto ? 'Change Banner' : 'Upload Banner'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended size: 1200x400 pixels. This will appear at the top of your public guide.
                </p>
              </div>
            </div>
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

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          {saveMessage && (
            <span className={`self-center text-sm px-3 py-1 rounded-full ${
              saveMessage.type === 'success' ? 'bg-green-100 text-green-700' :
              saveMessage.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {saveMessage.text}
            </span>
          )}

          {lastSaved && !saveMessage && (
            <span className="self-center text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Races Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Races & Candidates
            </h2>
            <p className="text-sm text-gray-600">
              Click on a race to expand it and add your recommendations.
            </p>
          </div>

          {/* Party Filter (for primaries) */}
          {availableParties.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={partyFilter || ''}
                onChange={(e) => setPartyFilter(e.target.value || null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Parties</option>
                {availableParties.map(party => (
                  <option key={party} value={party}>{party}</option>
                ))}
              </select>
              {partyFilter && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Primary mode
                </span>
              )}
            </div>
          )}
        </div>

        {filteredRaces.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">No races found for the selected party filter.</p>
            <button
              onClick={() => setPartyFilter(null)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRaces.map((race, index) => (
              <RaceSection
                key={race.id}
                race={race}
                guide={localGuide}
                onRecommendationChange={handleRecommendationChange}
                onSkipRace={(skip) => handleSkipRace(race.id, skip)}
                onSkipCandidate={(candidateId, skip) => handleSkipCandidate(race.id, candidateId, skip)}
                isEditing={true}
                defaultExpanded={index === 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Skipped Items Section */}
      {(skippedRacesCount > 0 || skippedCandidatesCount > 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <SkipForward className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-700">Skipped Items</h2>
            <span className="text-sm text-gray-500">
              ({skippedRacesCount + skippedCandidatesCount} total)
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            These items are hidden from your progress. Bring them back when you&apos;re ready to review.
          </p>

          {/* Skipped Races */}
          {skippedRacesCount > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Skipped Races</h3>
              <div className="space-y-2">
                {localGuide.skippedRaces?.map(raceId => {
                  const race = ballot.races.find(r => r.id === raceId);
                  if (!race) return null;
                  const raceName = race.district ? `${race.name} - ${race.district}` : race.name;
                  return (
                    <div key={raceId} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200">
                      <span className="text-gray-700">{raceName}</span>
                      <button
                        onClick={() => handleSkipRace(raceId, false)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Bring Back
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skipped Candidates */}
          {skippedCandidatesCount > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Skipped Candidates</h3>
              <div className="space-y-2">
                {localGuide.skippedCandidates?.map(sc => {
                  const race = ballot.races.find(r => r.id === sc.raceId);
                  const candidate = race?.candidates.find(c => c.id === sc.candidateId);
                  if (!race || !candidate) return null;
                  const raceName = race.district ? `${race.name} - ${race.district}` : race.name;
                  return (
                    <div key={`${sc.raceId}-${sc.candidateId}`} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200">
                      <div>
                        <span className="text-gray-700">{candidate.name}</span>
                        <span className="text-gray-400 text-sm ml-2">({raceName})</span>
                      </div>
                      <button
                        onClick={() => handleSkipCandidate(sc.raceId, sc.candidateId, false)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Bring Back
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
