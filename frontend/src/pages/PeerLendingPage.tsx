import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import type { PeerListing, PeerLoan } from '../types';

export default function PeerLendingPage() {
  const [listings, setListings] = useState<PeerListing[]>([]);
  const [loans, setLoans] = useState<PeerLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'textbook', condition: 'good' });
  const { addToast } = useToastStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [l, lo] = await Promise.all([
        api.get<PeerListing[]>('/peer-lending/listings'),
        api.get<PeerLoan[]>('/peer-lending/loans').catch(() => []),
      ]);
      setListings(l);
      setLoans(lo);
    } catch {
      addToast('error', 'Failed to load peer lending data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/peer-lending/listings', form);
      addToast('success', 'Listing created!');
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'textbook', condition: 'good' });
      loadData();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const handleRequest = async (listingId: string) => {
    try {
      await api.post('/peer-lending/loans', { listingId });
      addToast('success', 'Loan requested!');
      loadData();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

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
          <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>🤝 Peer Lending</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            Share and borrow items with fellow students
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          + New Listing
        </button>
      </div>

      {/* Active loans summary */}
      {loans.length > 0 && (
        <div className="glass-card glass-card--static mb-lg" style={{ padding: 'var(--cl-space-lg)' }}>
          <h3 className="font-semibold mb-md">My Loan Activity</h3>
          <div className="flex gap-md flex-wrap">
            {loans.slice(0, 3).map((loan) => (
              <div key={loan.id} className="flex items-center gap-sm">
                <span className={`badge badge--${loan.status === 'active' ? 'success' : loan.status === 'requested' ? 'warning' : 'neutral'}`}>
                  {loan.status}
                </span>
                <span className="text-sm">{loan.listing?.title || `Loan #${loan.id}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings grid */}
      {listings.length === 0 ? (
        <div className="glass-card glass-card--static empty-state">
          <div className="empty-state__icon">🤝</div>
          <div className="empty-state__title">No listings yet</div>
          <div className="empty-state__description">
            Be the first to share something with your peers!
          </div>
        </div>
      ) : (
        <div className="page-grid page-grid--3">
          {listings.map((listing) => (
            <div key={listing.id} className="glass-card" style={{ padding: 'var(--cl-space-lg)' }}>
              <div className="flex items-center gap-sm mb-md">
                <span style={{ fontSize: 24 }}>{categoryIcon(listing.category)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold truncate">{listing.title}</div>
                  <div className="text-xs text-muted">by {listing.owner?.firstName || 'Unknown'}</div>
                </div>
                <span className={`badge ${listing.available ? 'badge--success' : 'badge--neutral'}`}>
                  {listing.available ? 'Available' : 'Lent Out'}
                </span>
              </div>
              <p className="text-sm text-secondary mb-md" style={{ lineHeight: 1.5 }}>
                {listing.description?.substring(0, 100)}
              </p>
              <div className="flex items-center justify-between">
                <span className="badge badge--neutral">{listing.category}</span>
                <span className="text-xs text-muted">Condition: {listing.condition}</span>
              </div>
              {listing.available && (
                <button
                  className="btn btn--primary btn--sm w-full mt-md"
                  onClick={() => handleRequest(listing.id)}
                >
                  Request to Borrow
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create listing modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">New Listing</h3>
              <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="e.g. Calculus Textbook" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Describe the item..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="textbook">Textbook</option>
                  <option value="electronics">Electronics</option>
                  <option value="tools">Tools</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select className="form-select" value={form.condition} onChange={(e) => setForm(f => ({ ...f, condition: e.target.value }))}>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleCreate} disabled={!form.title || !form.description}>Create Listing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function categoryIcon(cat: string) {
  const map: Record<string, string> = { textbook: '📖', electronics: '💻', tools: '🔧', other: '📦' };
  return map[cat] || '📦';
}
