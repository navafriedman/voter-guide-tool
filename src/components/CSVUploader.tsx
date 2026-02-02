'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { parseCSV, generateSampleCSV } from '@/lib/csv-parser';
import { saveBallotData } from '@/lib/storage';
import type { BallotData } from '@/types';

interface CSVUploaderProps {
  onBallotLoaded: (ballot: BallotData) => void;
}

export function CSVUploader({ onBallotLoaded }: CSVUploaderProps) {
  const [ballotName, setBallotName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!ballotName.trim()) {
      setErrors(['Please enter a ballot name first']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseCSV(content, ballotName.trim());

      if (result.success && result.ballot) {
        saveBallotData(result.ballot);
        setErrors([]);
        setSuccess(true);
        onBallotLoaded(result.ballot);
      } else {
        setErrors(result.errors || ['Unknown error parsing CSV']);
        setSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFile(file);
    } else {
      setErrors(['Please upload a CSV file']);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const downloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_ballot.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Ballot Name Input */}
      <div>
        <label htmlFor="ballotName" className="block text-sm font-medium text-gray-700 mb-1">
          Ballot Name
        </label>
        <input
          type="text"
          id="ballotName"
          value={ballotName}
          onChange={(e) => setBallotName(e.target.value)}
          placeholder="e.g., North Carolina General Election 2025"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">
          Drop your CSV file here or click to browse
        </p>
        <p className="text-sm text-gray-500 mt-1">
          CSV should contain race and candidate information
        </p>
      </div>

      {/* Download Sample */}
      <button
        onClick={downloadSample}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        <Download className="w-4 h-4" />
        Download sample CSV template
      </button>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Errors found in CSV</h4>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-800">Ballot data loaded successfully!</span>
          </div>
        </div>
      )}

      {/* CSV Format Help */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-800">CSV Format</h4>
            <p className="text-sm text-gray-600 mt-1">
              Your CSV should include these columns (only <code className="bg-gray-200 px-1 rounded">race_name</code> and <code className="bg-gray-200 px-1 rounded">candidate_name</code> are required):
            </p>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside grid grid-cols-2 gap-1">
              <li>race_name *</li>
              <li>race_district</li>
              <li>race_order</li>
              <li>candidate_name *</li>
              <li>candidate_party</li>
              <li>candidate_title</li>
              <li>candidate_photo_url</li>
              <li>candidate_website</li>
              <li>candidate_twitter</li>
              <li>candidate_facebook</li>
              <li>candidate_instagram</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
