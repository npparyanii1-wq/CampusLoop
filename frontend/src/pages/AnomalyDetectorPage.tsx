import { useState } from 'react';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import type { AnomalyReport } from '../types';

export default function AnomalyDetectorPage() {
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const { addToast } = useToastStore();

  const handleScan = async () => {
    setLoading(true);
    try {
      const data = await api.post<AnomalyReport[]>('/analytics/anomaly-scan');
      setAnomalies(data);
      addToast('success', `Scan complete: ${data.length} anomalies detected`);
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (sev: string) => {
    if (sev === 'high') return 'danger';
    if (sev === 'medium') return 'warning';
    return 'primary';
  };

  const typeIcon = (type: string) => {
    if (type === 'bottleneck') return '🔴';
    if (type === 'idle') return '💤';
    return '📊';
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>📈 Anomaly Detector</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            AI-powered utilisation analysis — detect bottlenecks, idle assets, and overuse patterns
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleScan} disabled={loading}>
          {loading ? <span className="spinner" /> : '🔍 Run Scan'}
        </button>
      </div>

      {loading && (
        <div className="glass-card glass-card--static" style={{ padding: 'var(--cl-space-xl)' }}>
          <div className="flex flex-col items-center gap-md">
            <div className="spinner spinner--lg" />
            <p className="text-secondary">AI is analyzing 8-week booking history across all assets...</p>
          </div>
        </div>
      )}

      {!loading && anomalies.length === 0 && (
        <div className="glass-card glass-card--static empty-state">
          <div className="empty-state__icon">📈</div>
          <div className="empty-state__title">No anomalies scanned yet</div>
          <div className="empty-state__description">
            Click "Run Scan" to analyze booking patterns and detect utilisation anomalies
          </div>
        </div>
      )}

      {!loading && anomalies.length > 0 && (
        <div className="page-grid page-grid--2">
          {anomalies.map((a, i) => (
            <div
              key={i}
              className="glass-card glass-card--static"
              style={{
                padding: 'var(--cl-space-lg)',
                borderLeft: `3px solid var(--cl-${severityColor(a.severity)}-400)`,
              }}
            >
              <div className="flex items-center justify-between mb-md">
                <div className="flex items-center gap-sm">
                  <span style={{ fontSize: 20 }}>{typeIcon(a.anomalyType)}</span>
                  <div>
                    <div className="font-bold">{a.assetName}</div>
                    <div className="text-xs text-muted">Asset #{a.assetId}</div>
                  </div>
                </div>
                <div className="flex gap-xs">
                  <span className={`badge badge--${severityColor(a.severity)}`}>
                    {a.severity}
                  </span>
                  <span className="badge badge--neutral">{a.anomalyType}</span>
                </div>
              </div>

              <p className="text-sm text-secondary mb-md" style={{ lineHeight: 1.6 }}>
                {a.description}
              </p>

              <div
                style={{
                  padding: 'var(--cl-space-sm) var(--cl-space-md)',
                  background: 'var(--cl-bg-glass)',
                  borderRadius: 'var(--cl-radius-sm)',
                }}
              >
                <div className="text-xs text-muted mb-xs">💡 Recommendation</div>
                <div className="text-sm">{a.recommendation}</div>
              </div>

              {a.weeklyUsage && a.weeklyUsage.length > 0 && (
                <div className="mt-md">
                  <div className="text-xs text-muted mb-sm">Weekly Usage (last 8 weeks)</div>
                  <div className="flex gap-xs items-end" style={{ height: 40 }}>
                    {a.weeklyUsage.map((val, wi) => (
                      <div
                        key={wi}
                        style={{
                          flex: 1,
                          height: `${Math.max(4, (val / Math.max(...a.weeklyUsage)) * 40)}px`,
                          background: `var(--cl-${severityColor(a.severity)}-400)`,
                          borderRadius: '2px 2px 0 0',
                          opacity: 0.7,
                        }}
                        title={`Week ${wi + 1}: ${val} bookings`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
