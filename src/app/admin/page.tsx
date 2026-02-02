'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Trash2, Users, Vote } from 'lucide-react';
import { CSVUploader } from '@/components/CSVUploader';
import type { BallotData } from '@/types';
import { getBallotData, clearBallotData } from '@/lib/storage';
import { useHydrated } from '@/lib/hooks';

export default function AdminPage() {
  const hydrated = useHydrated();
  const [refreshKey, setRefreshKey] = useState(0);

  const ballot = useMemo<BallotData | null>(() => {
    if (!hydrated) return null;
    void refreshKey;
    return getBallotData();
  }, [hydrated, refreshKey]);

  const handleBallotLoaded = () => {
    setRefreshKey(k => k + 1);
  };

  const handleClearBallot = () => {
    if (confirm('Are you sure you want to clear the ballot data? This will not delete your voter guides.')) {
      clearBallotData();
      setRefreshKey(k => k + 1);
    }
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
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Manage ballot data and settings</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Load Ballot Data
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <CSVUploader onBallotLoaded={handleBallotLoaded} />
            </div>
          </div>

          {/* Current Ballot Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Current Ballot
            </h2>

            {ballot ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ballot.name}</h3>
                    {ballot.location && (
                      <p className="text-sm text-gray-500">{ballot.location}</p>
                    )}
                  </div>
                  <button
                    onClick={handleClearBallot}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear ballot data"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{ballot.races.length} races</span>
                    <span className="text-gray-300">•</span>
                    <span>{ballot.races.reduce((acc, r) => acc + r.candidates.length, 0)} candidates</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 space-y-2 max-h-80 overflow-y-auto">
                    {ballot.races.map(race => (
                      <div key={race.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-700">
                          {race.district ? `${race.name} - ${race.district}` : race.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {race.candidates.length} candidate{race.candidates.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href="/admin/create"
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Voter Guide
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-600 mb-1">No ballot loaded</h3>
                <p className="text-sm text-gray-500">
                  Upload a CSV file to load your ballot data
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
