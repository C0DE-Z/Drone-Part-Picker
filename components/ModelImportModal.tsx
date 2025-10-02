"use client";

import React, { useState } from 'react';
import { Loader2, Link2, FileDown, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (modelUrl: string) => void;
};

type ApiResult = {
  source: string;
  models: Array<{ url: string; type: string; size?: string; title?: string }>;
  pageTitle?: string;
  error?: string;
};

export default function ModelImportModal({ open, onClose, onSelect }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ApiResult | null>(null);

  if (!open) return null;

  const isDirectModelUrl = (u: string) => /\.(gltf|glb|obj|stl)(\?|#|$)/i.test(u.trim());

  const scrape = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      // If it's a direct model URL, short-circuit and present it as a single result
      if (isDirectModelUrl(url)) {
        setResults({
          source: url,
          models: [{ url, type: (url.split('.').pop()?.toLowerCase() as 'gltf' | 'glb' | 'obj' | 'stl' | 'unknown') || 'unknown' }],
          pageTitle: 'Direct model link'
        });
        return;
      }
      const res = await fetch('/api/models/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = (await res.json()) as ApiResult;
      if (!res.ok) {
        throw new Error(data.error || 'Failed to scrape');
      }
      setResults(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to scrape';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Import 3D Model from URL</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Page URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={scrape}
                disabled={!url || loading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Fetch
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {results && (
            <div className="space-y-2">
              <div className="text-sm text-gray-700">
                {results.pageTitle ? (
                  <span>Found {results.models.length} model link(s) on “{results.pageTitle}”.</span>
                ) : (
                  <span>Found {results.models.length} model link(s).</span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y">
                {results.models.map((m) => (
                  <div key={m.url} className="flex items-center justify-between py-2">
                    <div className="min-w-0 mr-2">
                      <div className="text-sm font-medium truncate">{m.url}</div>
                      <div className="text-xs text-gray-500">{m.type.toUpperCase()}</div>
                    </div>
                    <button
                      onClick={() => onSelect(m.url)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
                    >
                      <FileDown className="w-4 h-4" /> Use
                    </button>
                  </div>
                ))}
                {results.models.length === 0 && (
                  <div className="text-sm text-gray-500 py-6 text-center space-y-3">
                    <div>No direct .glb/.gltf/.obj/.stl links found on this page.</div>
                    {isDirectModelUrl(url) ? (
                      <button
                        onClick={() => onSelect(url)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
                      >
                        <FileDown className="w-4 h-4" /> Use typed URL
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t flex justify-end">
          <button onClick={onClose} className="px-3 py-1.5 rounded border text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
