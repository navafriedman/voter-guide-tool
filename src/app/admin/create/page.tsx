'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Vote, AlertCircle } from 'lucide-react';
import { GuideEditor } from '@/components/GuideEditor';
import type { VoterGuide, BallotData } from '@/types';
import { createNewGuide, getBallotData } from '@/lib/storage';
import { useHydrated } from '@/lib/hooks';

export default function CreateGuidePage() {
  const hydrated = useHydrated();
  const [guide, setGuide] = useState<VoterGuide | null>(null);
  const [guideName, setGuideName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [step, setStep] = useState<'info' | 'edit'>('info');

  const ballot = useMemo<BallotData | null>(() => {
    if (!hydrated) return null;
    return getBallotData();
  }, [hydrated]);

  const handleCreateGuide = () => {
    if (!guideName.trim() || !authorName.trim()) return;
    const newGuide = createNewGuide(guideName.trim(), authorName.trim());
    setGuide(newGuide);
    setStep('edit');
  };

  const handleGuideUpdate = (updatedGuide: VoterGuide) => {
    setGuide(updatedGuide);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Create Voter Guide</h1>
                <p className="text-sm text-gray-500">
                  {step === 'info' ? 'Step 1: Basic Information' : 'Step 2: Add Endorsements'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* No ballot warning */}
        {!ballot && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">No ballot data loaded</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You need to load ballot data before creating a voter guide.{' '}
                  <Link href="/admin" className="underline hover:no-underline">
                    Go to Admin Panel
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 'info' && ballot && (
          <div className="max-w-xl">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="guideName" className="block text-sm font-medium text-gray-700 mb-1">
                    Guide Name *
                  </label>
                  <input
                    type="text"
                    id="guideName"
                    value={guideName}
                    onChange={(e) => setGuideName(e.target.value)}
                    placeholder="e.g., My 2025 Election Guide"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="authorName"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g., Jane Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleCreateGuide}
                  disabled={!guideName.trim() || !authorName.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Endorsements
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Edit Guide */}
        {step === 'edit' && guide && ballot && (
          <GuideEditor
            guide={guide}
            ballot={ballot}
            onGuideUpdate={handleGuideUpdate}
          />
        )}
      </main>
    </div>
  );
}
