import { useState } from 'react';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import type { AISearchResult } from '../types';

export default function AISearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISearchResult | null>(null);
  const [history, setHistory] = useState<{ query: string; result: AISearchResult }[]>([]);
  const { addToast } = useToastStore();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.post<AISearchResult>('/assets/search/smart', { query });
      setResult(data);
      setHistory((h) => [{ query, result: data }, ...h.slice(0, 4)]);
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-lg">
        <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>
          ✨ AI Smart Search
        </h1>
        <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
          Describe what you need in natural language — AI finds the best matching assets with rationale
        </p>
      </div>

      {/* Search input */}
      <div className="glass-card glass-card--static" style={{ padding: 'var(--cl-space-lg)' }}>
        <div className="flex gap-md">
          <input
            id="ai-search-input"
            className="form-input flex-1"
            type="text"
            placeholder='e.g. "I need a microscope for biology lab tomorrow afternoon"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            id="ai-search-submit"
            className="btn btn--primary"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? <span className="spinner" /> : '🔍 Search'}
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex gap-sm mt-md flex-wrap">
          {[
            'I need a 3D printer for my engineering project',
            'Available study rooms for group of 5 this Friday',
            'Spectrophotometer for chemistry experiments',
            'Bicycle to commute between campuses',
          ].map((s) => (
            <button
              key={s}
              className="chip"
              onClick={() => setQuery(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-card glass-card--static mt-lg" style={{ padding: 'var(--cl-space-xl)' }}>
          <div className="flex flex-col items-center gap-md">
            <div className="spinner spinner--lg" />
            <p className="text-secondary">AI is analyzing your request...</p>
          </div>
        </div>
      )}

      {/* AI Results */}
      {result && !loading && (
        <div className="mt-lg animate-slide-up">
          {/* Rationale */}
          <div
            className="glass-card glass-card--static mb-lg"
            style={{ padding: 'var(--cl-space-lg)', borderLeft: '3px solid var(--cl-primary-500)' }}
          >
            <div className="flex items-center gap-sm mb-md">
              <span style={{ fontSize: 20 }}>🤖</span>
              <span className="font-bold">AI Analysis</span>
            </div>
            <p className="text-sm" style={{ lineHeight: 1.7 }}>{result.rationale}</p>
            {result.predictedReturnDate && (
              <div className="mt-md">
                <span className="badge badge--primary">
                  📅 Expected availability: {result.predictedReturnDate}
                </span>
              </div>
            )}
          </div>

          {/* Matched assets */}
          {result.assets && result.assets.length > 0 ? (
            <div className="page-grid page-grid--3">
              {result.assets.map((asset) => (
                <div key={asset.id} className="glass-card" style={{ padding: 'var(--cl-space-lg)' }}>
                  <div className="flex items-center gap-sm mb-md">
                    <span style={{ fontSize: 24 }}>{assetIcon(asset.category)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-bold truncate">{asset.name}</div>
                      <div className="text-xs text-muted">
                        {asset.department?.name || 'General'}
                      </div>
                    </div>
                    <span className={`badge badge--${asset.status === 'available' ? 'success' : 'warning'}`}>
                      {asset.status}
                    </span>
                  </div>
                  <p className="text-sm text-secondary mb-md">
                    {asset.description?.substring(0, 100)}
                  </p>
                  <span className="badge badge--neutral">{asset.condition}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card glass-card--static empty-state">
              <div className="empty-state__icon">🤷</div>
              <div className="empty-state__title">No exact matches found</div>
              {result.fallbackSuggestion && (
                <div className="empty-state__description">
                  💡 {result.fallbackSuggestion}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search history */}
      {history.length > 0 && (
        <div className="mt-lg">
          <h3 className="text-sm text-muted mb-md" style={{ fontWeight: 600 }}>
            Recent Searches
          </h3>
          <div className="flex flex-col gap-sm">
            {history.map((h, i) => (
              <button
                key={i}
                className="chip"
                onClick={() => { setQuery(h.query); setResult(h.result); }}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                🕐 {h.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function assetIcon(cat: string) {
  const map: Record<string, string> = {
    equipment: '🔬',
    room: '🏫',
    loanable: '🚲',
    consumable: '📦',
  };
  return map[cat] || '📦';
}
