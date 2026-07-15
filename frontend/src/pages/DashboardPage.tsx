import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuthStore } from '../stores/authStore';
import type { Asset, Booking } from '../types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Asset[]>('/assets').catch(() => []),
      api.get<Booking[]>('/bookings').catch(() => []),
    ]).then(([a, b]) => {
      setAssets(a);
      setBookings(b);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => ['active', 'approved'].includes(b.status));
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const availableAssets = assets.filter((a) => a.status === 'available');

  const stats = [
    {
      label: 'Total Assets',
      value: assets.length,
      variant: 'primary' as const,
    },
    {
      label: 'Available Now',
      value: availableAssets.length,
      variant: 'success' as const,
    },
    {
      label: 'Active Bookings',
      value: activeBookings.length,
      variant: 'warning' as const,
    },
    {
      label: 'Pending Requests',
      value: pendingBookings.length,
      variant: 'accent' as const,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            Here&apos;s what&apos;s happening on campus today
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="page-grid page-grid--4 mb-lg">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`glass-card stat-card stat-card--${s.variant}`}
            style={{ animationDelay: `${i * 80}ms`, animation: 'slideUp 0.5s ease forwards', opacity: 0 }}
          >
            <div className="stat-card__label">{s.label}</div>
            <div className={`stat-card__value stat-card__value--${s.variant}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="glass-card glass-card--static" style={{ padding: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: 'var(--cl-space-lg)' }}>
          <h2 style={{ fontSize: 'var(--cl-font-lg)', fontWeight: 700 }}>Recent Bookings</h2>
          <span className="badge badge--primary">{bookings.length} total</span>
        </div>
        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📅</div>
            <div className="empty-state__title">No bookings yet</div>
            <div className="empty-state__description">
              Browse assets and make your first booking
            </div>
          </div>
        ) : (
        <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Date</th>
                <th>Status</th>
                <th>Lead Time</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 8).map((b) => (
                <tr key={b.id}>
                  <td className="font-semibold">{b.asset?.name || `Asset #${b.assetId}`}</td>
                  <td className="text-secondary">
                    {new Date(b.startTime).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge badge--${statusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="text-secondary truncate" style={{ maxWidth: 200 }}>
                    {b.asset?.bookingLeadTime != null ? `${b.asset.bookingLeadTime} days` : 'Immediate'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Available assets preview */}
      <div className="mt-lg">
        <h2 style={{ fontSize: 'var(--cl-font-lg)', fontWeight: 700, marginBottom: 'var(--cl-space-md)' }}>
          Available Assets
        </h2>
        <div className="page-grid page-grid--3">
          {availableAssets.slice(0, 6).map((a) => (
            <div key={a.id} className="glass-card" style={{ padding: 'var(--cl-space-lg)' }}>
              <div className="flex items-center gap-sm mb-md">
                <span style={{ fontSize: 24 }}>{assetIcon(a.category)}</span>
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted">{a.department?.name || 'General'}</div>
                </div>
              </div>
              <p className="text-sm text-secondary" style={{ marginBottom: 'var(--cl-space-sm)' }}>
                {a.description?.substring(0, 80)}
                {(a.description?.length || 0) > 80 ? '...' : ''}
              </p>
              <div className="flex items-center justify-between">
                <span className="badge badge--success">Available</span>
                <span className="badge badge--neutral">{a.condition}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
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

function assetIcon(category: string) {
  const map: Record<string, string> = {
    equipment: '🔬',
    room: '🏫',
    loanable: '🚲',
    consumable: '📦',
  };
  return map[category] || '📦';
}
