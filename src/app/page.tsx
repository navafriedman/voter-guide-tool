'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Vote, Plus, FileText, Settings, ArrowRight, Trash2 } from 'lucide-react';
import type { VoterGuide, BallotData } from '@/types';
import { getAllGuides, getBallotData, deleteGuide } from '@/lib/storage';
import { useHydrated } from '@/lib/hooks';

export default function Home() {
  const hydrated = useHydrated();
  const [refreshKey, setRefreshKey] = useState(0);

  const guides = useMemo<VoterGuide[]>(() => {
    if (!hydrated) return [];
    void refreshKey; // Dependency to trigger re-fetch
    return getAllGuides();
  }, [hydrated, refreshKey]);

  const ballot = useMemo<BallotData | null>(() => {
    if (!hydrated) return null;
    return getBallotData();
  }, [hydrated]);

  const handleDeleteGuide = (id: string) => {
    if (confirm('Are you sure you want to delete this guide?')) {
      deleteGuide(id);
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Voter Guide Tool</h1>
              <p className="text-sm text-gray-500">Create and share your voting recommendations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Getting Started */}
        {!ballot && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-6">
              Get started by loading your ballot data. You can upload a CSV file with all the races
              and candidates, then create your personalized voter guide.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Go to Admin Panel
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Ballot Status */}
        {ballot && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Ballot Loaded: {ballot.name}</p>
                  <p className="text-sm text-green-600">
                    {ballot.races.length} races • {ballot.races.reduce((acc, r) => acc + r.candidates.length, 0)} candidates
                  </p>
                </div>
              </div>
              <Link
                href="/admin"
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                Manage
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin/create"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Create New Guide</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Start a new voter guide with your endorsements
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Admin Panel</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage ballot data and settings
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Your Guides */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Voter Guides</h2>

          {guides.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No guides yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Create your first voter guide to share your recommendations with others.
              </p>
              <Link
                href="/admin/create"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create your first guide
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {guides.map(guide => (
                <div
                  key={guide.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${guide.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <h3 className="font-medium text-gray-900">{guide.name}</h3>
                      <p className="text-sm text-gray-500">
                        by {guide.authorName} • {guide.endorsements.filter(e => e.status !== 'none').length} endorsements
                        {guide.isPublished ? ' • Published' : ' • Draft'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/edit/${guide.id}`}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/guide/${guide.id}`}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteGuide(guide.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
