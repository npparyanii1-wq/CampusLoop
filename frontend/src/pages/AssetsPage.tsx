import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import type { Asset } from '../types';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    startTime: '',
    endTime: '',
    purpose: '',
  });
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await api.get<Asset[]>('/assets');
      setAssets(data);
    } catch {
      addToast('error', 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedAsset) return;
    try {
      await api.post('/bookings', {
        assetId: selectedAsset.id,
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: new Date(bookingForm.endTime).toISOString(),
        purpose: bookingForm.purpose,
      });
      addToast('success', `Booking created for ${selectedAsset.name}`);
      setBookingModal(false);
      setBookingForm({ startTime: '', endTime: '', purpose: '' });
      loadAssets();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const filtered = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || a.category === typeFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

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
        <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>Assets</h1>
        <button className="btn btn--primary" onClick={() => navigate('/ai-search')}>
          ✨ AI Search
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-md mb-lg flex-wrap">
        <div className="search-input-wrapper" style={{ maxWidth: 320 }}>
          <span className="search-input-wrapper__icon">🔍</span>
          <input
            id="asset-search"
            className="form-input"
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="asset-type-filter"
          className="form-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="all">All Types</option>
          <option value="equipment">Equipment</option>
          <option value="room">Room</option>
          <option value="loanable">Loanable</option>
        </select>

        <select
          id="asset-status-filter"
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted mb-md">
        Showing {filtered.length} of {assets.length} assets
      </div>

      {/* Asset grid */}
      {filtered.length === 0 ? (
        <div className="glass-card glass-card--static empty-state">
          <div className="empty-state__icon">🔬</div>
          <div className="empty-state__title">No assets found</div>
          <div className="empty-state__description">
            Try adjusting your search or filters
          </div>
        </div>
      ) : (
        <div className="page-grid page-grid--3">
          {filtered.map((asset) => (
            <div key={asset.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Asset header band */}
              <div
                style={{
                  height: 6,
                  background:
                    asset.status === 'available'
                      ? 'linear-gradient(90deg, var(--cl-success-400), var(--cl-success-500))'
                      : asset.status === 'booked'
                      ? 'linear-gradient(90deg, var(--cl-warning-400), var(--cl-warning-500))'
                      : 'linear-gradient(90deg, var(--cl-text-muted), var(--cl-text-muted))',
                }}
              />
              <div style={{ padding: 'var(--cl-space-lg)' }}>
                <div className="flex items-center gap-sm mb-md">
                  <span style={{ fontSize: 28 }}>{assetIcon(asset.category)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-bold truncate">{asset.name}</div>
                    <div className="text-xs text-muted">{asset.department?.name || 'General'}</div>
                  </div>
                  <span className={`badge badge--${statusBadge(asset.status)}`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-secondary mb-md" style={{ lineHeight: 1.5 }}>
                  {asset.description?.substring(0, 100)}
                  {(asset.description?.length || 0) > 100 ? '...' : ''}
                </p>

                <div className="flex items-center justify-between">
                  <span className="badge badge--neutral">{asset.condition}</span>
                  {asset.isHighValue && (
                    <span className="badge badge--warning">★ High Value</span>
                  )}
                </div>

                {asset.status === 'available' && (
                  <button
                    className="btn btn--primary btn--sm w-full mt-md"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setBookingModal(true);
                    }}
                  >
                    Book Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => setBookingModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Book: {selectedAsset.name}</h3>
              <button
                className="btn btn--ghost btn--icon btn--sm"
                onClick={() => setBookingModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label" htmlFor="booking-start">Start Time</label>
                <input
                  id="booking-start"
                  className="form-input"
                  type="datetime-local"
                  value={bookingForm.startTime}
                  onChange={(e) =>
                    setBookingForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="booking-end">End Time</label>
                <input
                  id="booking-end"
                  className="form-input"
                  type="datetime-local"
                  value={bookingForm.endTime}
                  onChange={(e) =>
                    setBookingForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="booking-purpose">Purpose</label>
                <textarea
                  id="booking-purpose"
                  className="form-textarea"
                  placeholder="Describe why you need this asset..."
                  value={bookingForm.purpose}
                  onChange={(e) =>
                    setBookingForm((f) => ({ ...f, purpose: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--secondary"
                onClick={() => setBookingModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={handleBook}
                disabled={!bookingForm.startTime || !bookingForm.endTime || !bookingForm.purpose}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    available: 'success',
    booked: 'warning',
    maintenance: 'danger',
    retired: 'neutral',
  };
  return map[status] || 'neutral';
}

function assetIcon(cat: string) {
  const map: Record<string, string> = {
    equipment: '🔬',
    room: '🏫',
    loanable: '🚲',
  };
  return map[cat] || '📦';
}
