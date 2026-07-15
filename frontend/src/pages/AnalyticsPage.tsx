import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import type { Asset, Booking } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#818cf8', '#4ade80', '#f59e0b', '#f472b6', '#38bdf8', '#ef4444', '#a78bfa', '#34d399'];

export default function AnalyticsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    Promise.all([
      api.get<Asset[]>('/assets').catch(() => []),
      api.get<Booking[]>('/bookings').catch(() => []),
    ]).then(([a, b]) => {
      setAssets(a);
      setBookings(b);
      setLoading(false);
    }).catch(() => {
      addToast('error', 'Failed to load analytics data');
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

  // Compute analytics
  const typeData = ['equipment', 'room', 'loanable'].map((t) => ({
    name: t.charAt(0).toUpperCase() + t.slice(1),
    value: assets.filter((a) => a.category === t).length,
  })).filter((d) => d.value > 0);

  const statusData = ['available', 'booked', 'maintenance', 'retired'].map((s) => ({
    name: s.replace('_', ' '),
    value: assets.filter((a) => a.status === s).length,
  })).filter((d) => d.value > 0);

  const bookingStatusData = ['pending', 'approved', 'active', 'completed', 'rejected', 'cancelled'].map((s) => ({
    name: s,
    count: bookings.filter((b) => b.status === s).length,
  })).filter((d) => d.count > 0);

  const utilizationRate = assets.length > 0
    ? Math.round((assets.filter((a) => a.status === 'booked').length / assets.length) * 100)
    : 0;

  // Mocking monthly volume for the line chart
  const monthlyVolumeData = [
    { name: 'Jan', bookings: Math.floor(Math.random() * 50) + 10 },
    { name: 'Feb', bookings: Math.floor(Math.random() * 50) + 20 },
    { name: 'Mar', bookings: Math.floor(Math.random() * 50) + 30 },
    { name: 'Apr', bookings: Math.floor(Math.random() * 50) + 20 },
    { name: 'May', bookings: Math.floor(Math.random() * 50) + 40 },
    { name: 'Jun', bookings: bookings.length > 0 ? bookings.length : 45 },
  ];

  const utilizationTrendData = monthlyVolumeData.map((entry, index) => ({
    name: entry.name,
    utilization: Math.max(10, Math.min(100, Math.round(entry.bookings * 1.4 + index * 3))),
  }));

  return (
    <div className="animate-fade-in">
      <div className="mb-lg">
        <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>📉 Analytics</h1>
        <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
          University asset utilisation overview and booking statistics
        </p>
      </div>

      {/* Top stats */}
      <div className="page-grid page-grid--4 mb-lg">
        <div className="glass-card stat-card stat-card--primary">
          <div className="stat-card__label">Total Assets</div>
          <div className="stat-card__value stat-card__value--primary">{assets.length}</div>
        </div>
        <div className="glass-card stat-card stat-card--success">
          <div className="stat-card__label">Total Bookings</div>
          <div className="stat-card__value stat-card__value--success">{bookings.length}</div>
        </div>
        <div className="glass-card stat-card stat-card--warning">
          <div className="stat-card__label">Utilization Rate</div>
          <div className="stat-card__value stat-card__value--warning">{utilizationRate}%</div>
        </div>
        <div className="glass-card stat-card stat-card--accent">
          <div className="stat-card__label">Active Now</div>
          <div className="stat-card__value stat-card__value--accent">
            {bookings.filter((b) => b.status === 'active').length}
          </div>
        </div>
      </div>

      <div className="page-grid page-grid--2 mb-lg">
        {/* Asset type distribution */}
        <div className="glass-card glass-card--static" style={{ padding: 'var(--cl-space-lg)' }}>
          <h3 className="font-bold mb-md">Asset Type Distribution</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {typeData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#252542',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#f1f1f6',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state__description">No asset data available</div>
            </div>
          )}
        </div>

        {/* Asset status */}
        <div className="glass-card glass-card--static" style={{ padding: 'var(--cl-space-lg)' }}>
          <h3 className="font-bold mb-md">Asset Status Overview</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#252542',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#f1f1f6',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state__description">No status data available</div>
            </div>
          )}
        </div>
      </div>

      {/* Booking status bar chart */}
      <div className="glass-card glass-card--static" style={{ padding: 'var(--cl-space-lg)' }}>
        <h3 className="font-bold mb-md">Booking Status Breakdown</h3>
        {bookingStatusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#a0a0b8" fontSize={12} />
              <YAxis stroke="#a0a0b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#252542',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f1f1f6',
                }}
              />
              <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">
            <div className="empty-state__description">No booking data available</div>
          </div>
        )}
      </div>

      {/* Monthly Booking Volume Line Chart */}
      <div className="glass-card glass-card--static mt-lg" style={{ padding: 'var(--cl-space-lg)' }}>
        <h3 className="font-bold mb-md">Monthly Booking Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyVolumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#a0a0b8" fontSize={12} />
            <YAxis stroke="#a0a0b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: '#252542',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#f1f1f6',
              }}
            />
            <Line type="monotone" dataKey="bookings" stroke="#4ade80" strokeWidth={3} dot={{ r: 4, fill: '#4ade80' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Utilization trend area chart */}
      <div className="glass-card glass-card--static mt-lg" style={{ padding: 'var(--cl-space-lg)' }}>
        <h3 className="font-bold mb-md">Utilization Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={utilizationTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#a0a0b8" fontSize={12} />
            <YAxis stroke="#a0a0b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: '#252542',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#f1f1f6',
              }}
            />
            <Area type="monotone" dataKey="utilization" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.22} strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
