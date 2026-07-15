import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import type { Booking } from '../types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { addToast } = useToastStore();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api.get<Booking[]>('/bookings');
      setBookings(data);
    } catch {
      addToast('error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
      addToast('success', 'Booking cancelled');
      loadBookings();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'approved' });
      addToast('success', 'Booking approved');
      loadBookings();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'rejected' });
      addToast('success', 'Booking rejected');
      loadBookings();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const filtered = bookings.filter((b) =>
    filter === 'all' ? true : b.status === filter
  );

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
        <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>Bookings</h1>
        <span className="badge badge--primary">{bookings.length} total</span>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-sm mb-lg flex-wrap">
        {['all', 'pending', 'approved', 'active', 'completed', 'rejected', 'cancelled'].map(
          (s) => (
            <button
              key={s}
              className={`chip ${filter === s ? 'chip--selected' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && (
                <span style={{ opacity: 0.6 }}>
                  {' '}({bookings.filter((b) => b.status === s).length})
                </span>
              )}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card glass-card--static empty-state">
          <div className="empty-state__icon">📅</div>
          <div className="empty-state__title">No bookings found</div>
          <div className="empty-state__description">
            {filter === 'all'
              ? 'You haven\'t made any bookings yet'
              : `No ${filter} bookings`}
          </div>
        </div>
      ) : (
        <div className="glass-card glass-card--static" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Start</th>
                <th>End</th>
                <th>Lead Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="font-semibold">
                    {b.asset?.name || `Asset #${b.assetId}`}
                  </td>
                  <td className="text-secondary text-sm">
                    {new Date(b.startTime).toLocaleString()}
                  </td>
                  <td className="text-secondary text-sm">
                    {new Date(b.endTime).toLocaleString()}
                  </td>
                  <td className="text-secondary text-sm truncate" style={{ maxWidth: 200 }}>
                    {b.asset?.bookingLeadTime != null ? `${b.asset.bookingLeadTime} days` : 'Immediate'}
                  </td>
                  <td>
                    <span className={`badge badge--${statusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-xs">
                      {b.status === 'pending' && (
                        <>
                          <button
                            className="btn btn--success btn--sm"
                            onClick={() => handleApprove(b.id)}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => handleReject(b.id)}
                            title="Reject"
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {['pending', 'approved'].includes(b.status) && (
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleCancel(b.id)}
                          title="Cancel"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'primary',
    active: 'success',
    completed: 'neutral',
    rejected: 'danger',
    cancelled: 'neutral',
  };
  return map[status] || 'neutral';
}
