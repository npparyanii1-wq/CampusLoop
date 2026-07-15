import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';
import type { LostFoundItem } from '../types';

interface AiMatchCandidate {
  lostItem: LostFoundItem;
  foundItem: LostFoundItem;
  probability: number;
  reasoning: string;
}

export default function LostFoundPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [matches, setMatches] = useState<AiMatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'lost' | 'found' | 'matches'>('all');
  const [showReport, setShowReport] = useState(false);
  const [form, setForm] = useState({
    type: 'lost' as 'lost' | 'found',
    description: '',
    lastSeenLocation: '',
    condition: 'good',
    photoUrl: '',
  });
  const { addToast } = useToastStore();

  useEffect(() => {
    loadItems();
    if (user?.role === 'lfofficer' || user?.role === 'admin') {
      loadMatches();
    }
  }, [user]);

  const loadItems = async () => {
    try {
      const data = await api.get<LostFoundItem[]>('/lost-found');
      setItems(data);
    } catch {
      addToast('error', 'Failed to load lost & found items');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const data = await api.get<AiMatchCandidate[]>('/lost-found/matches');
      setMatches(data);
    } catch {
      // Quiet fail if not authorized or endpoint error
    }
  };

  const handleReport = async () => {
    try {
      await api.post('/lost-found', {
        type: form.type,
        description: form.description,
        lastSeenLocation: form.lastSeenLocation,
        condition: form.condition,
        photoUrl: form.photoUrl || undefined,
      });
      addToast('success', 'Item reported successfully!');
      setShowReport(false);
      setForm({ type: 'lost', description: '', lastSeenLocation: '', condition: 'good', photoUrl: '' });
      loadItems();
      if (user?.role === 'lfofficer' || user?.role === 'admin') {
        loadMatches();
      }
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const handleLinkClaim = async (lostId: string, foundId: string) => {
    try {
      await api.post('/lost-found/claim', { lostId, foundId });
      addToast('success', 'Claim resolved successfully and items linked!');
      loadItems();
      loadMatches();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const handleResolveSingle = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/lost-found/${id}/status`, { status: newStatus });
      addToast('success', `Status updated to ${newStatus}`);
      loadItems();
      if (user?.role === 'lfofficer' || user?.role === 'admin') {
        loadMatches();
      }
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const filtered = items.filter((i) =>
    tab === 'all' || tab === 'matches' ? true : i.type === tab
  );

  const isOfficer = user?.role === 'lfofficer' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>🔍 Lost & Found</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            Report lost items or register found items to help reunite them
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowReport(true)}>
          + Report Item
        </button>
      </div>

      {/* Tab chips */}
      <div className="flex gap-sm mb-lg flex-wrap">
        {(['all', 'lost', 'found'] as const).map((t) => (
          <button
            key={t}
            className={`chip ${tab === t ? 'chip--selected' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'lost' ? '😢 Lost' : t === 'found' ? '🎉 Found' : '📋 All'}
            <span style={{ opacity: 0.6 }}>
              {' '}({t === 'all' ? items.length : items.filter((i) => i.type === t).length})
            </span>
          </button>
        ))}
        {isOfficer && (
          <button
            className={`chip ${tab === 'matches' ? 'chip--selected' : ''}`}
            onClick={() => setTab('matches')}
          >
            ✨ AI Matches
            <span style={{ opacity: 0.6 }}> ({matches.length})</span>
          </button>
        )}
      </div>

      {tab === 'matches' && isOfficer ? (
        matches.length === 0 ? (
          <div className="glass-card glass-card--static empty-state">
            <div className="empty-state__icon">✨</div>
            <div className="empty-state__title">No AI Matches Found</div>
            <div className="empty-state__description">
              No overlapping keyword or location matches detected at this moment.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            {matches.map((m, i) => (
              <div key={i} className="glass-card glass-card--static" style={{ padding: 'var(--cl-space-lg)' }}>
                <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
                  <div className="flex items-center gap-sm">
                    <span className="badge badge--warning">★ {m.probability}% Match</span>
                    <span className="text-xs text-secondary">{m.reasoning}</span>
                  </div>
                  <button
                    className="btn btn--success btn--sm"
                    onClick={() => handleLinkClaim(m.lostItem.id, m.foundItem.id)}
                  >
                    🔗 Link & Resolve Claim
                  </button>
                </div>
                <div className="page-grid page-grid--2">
                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: 'var(--cl-space-md)', borderRadius: 'var(--cl-radius-md)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <div className="font-bold mb-xs">😢 Lost Item Details</div>
                    <p className="text-sm mb-sm">{m.lostItem.description}</p>
                    <div className="text-xs text-muted">📍 Location: {m.lostItem.lastSeenLocation}</div>
                    <div className="text-xs text-muted">👤 Reporter: {m.lostItem.reportedBy?.email}</div>
                  </div>
                  <div style={{ background: 'rgba(34, 197, 94, 0.05)', padding: 'var(--cl-space-md)', borderRadius: 'var(--cl-radius-md)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                    <div className="font-bold mb-xs">🎉 Found Item Details</div>
                    <p className="text-sm mb-sm">{m.foundItem.description}</p>
                    <div className="text-xs text-muted">📍 Location: {m.foundItem.lastSeenLocation}</div>
                    <div className="text-xs text-muted">👤 Finder: {m.foundItem.reportedBy?.email}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="glass-card glass-card--static empty-state">
          <div className="empty-state__icon">🔍</div>
          <div className="empty-state__title">No items reported</div>
          <div className="empty-state__description">
            Report a lost or found item to get started
          </div>
        </div>
      ) : (
        <div className="page-grid page-grid--2">
          {filtered.map((item) => (
            <div key={item.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  height: 4,
                  background: item.type === 'lost'
                    ? 'linear-gradient(90deg, var(--cl-danger-400), var(--cl-danger-500))'
                    : 'linear-gradient(90deg, var(--cl-success-400), var(--cl-success-500))',
                }}
              />
              <div style={{ padding: 'var(--cl-space-lg)' }}>
                <div className="flex items-center gap-sm mb-md">
                  <span style={{ fontSize: 24 }}>{item.type === 'lost' ? '😢' : '🎉'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-bold truncate">
                      {item.type.toUpperCase()} in {item.lastSeenLocation}
                    </div>
                    <div className="text-xs text-muted">
                      {new Date(item.loggedAt).toLocaleDateString()} · {item.lastSeenLocation}
                    </div>
                  </div>
                  <span className={`badge ${item.status === 'claimed' ? 'badge--success' : item.type === 'lost' ? 'badge--danger' : 'badge--primary'}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-secondary mb-md" style={{ lineHeight: 1.5 }}>
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">
                    Reported by {item.reportedBy?.firstName || 'Anonymous'} ({item.reportedBy?.email || 'N/A'})
                  </span>
                  {isOfficer && item.status === 'reported' && (
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleResolveSingle(item.id, 'resolved')}
                    >
                      ✓ Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Report Item</h3>
              <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setShowReport(false)}>×</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label" htmlFor="lf-type">Type</label>
                <select id="lf-type" className="form-select" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as 'lost' | 'found' }))}>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lf-desc">Description</label>
                <textarea id="lf-desc" className="form-textarea" placeholder="Describe the item (e.g. blue leather wallet containing student card)..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lf-loc">Last Seen Location</label>
                <input id="lf-loc" className="form-input" placeholder="e.g. Science Library, Level 2" value={form.lastSeenLocation} onChange={(e) => setForm(f => ({ ...f, lastSeenLocation: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lf-condition">Condition</label>
                <select id="lf-condition" className="form-select" value={form.condition} onChange={(e) => setForm(f => ({ ...f, condition: e.target.value }))}>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lf-photo">Photo URL (Optional)</label>
                <input id="lf-photo" className="form-input" placeholder="https://..." value={form.photoUrl} onChange={(e) => setForm(f => ({ ...f, photoUrl: e.target.value }))} />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowReport(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleReport} disabled={!form.description || !form.lastSeenLocation}>Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
