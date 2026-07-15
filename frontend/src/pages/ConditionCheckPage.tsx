import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import type { Booking, ConditionAssessment } from '../types';

interface PrefillResponse {
  bookingId: string;
  assetName: string;
  previousCondition: string;
  aiAssessment: ConditionAssessment;
  photoUrl: string;
  studentNote: string;
}

export default function ConditionCheckPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loadingAssess, setLoadingAssess] = useState(false);
  const [prefill, setPrefill] = useState<PrefillResponse | null>(null);
  
  // Inspection confirmation form
  const [finalCondition, setFinalCondition] = useState('excellent');
  const [finalAction, setFinalAction] = useState('ready for reuse');
  const [managerComment, setManagerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToastStore();

  useEffect(() => {
    loadActiveBookings();
  }, []);

  const loadActiveBookings = async () => {
    try {
      const data = await api.get<Booking[]>('/bookings');
      // Show bookings that are approved or active (i.e. can be inspected and returned)
      const active = data.filter((b) => ['approved', 'active'].includes(b.status));
      setBookings(active);
      if (active.length > 0) {
        setSelectedBookingId(active[0].id);
      }
    } catch {
      addToast('error', 'Failed to load active bookings');
    }
  };

  const handleAssessReturn = async () => {
    if (!selectedBookingId || !description.trim()) {
      addToast('warning', 'Please select a booking and provide a return description');
      return;
    }
    setLoadingAssess(true);
    setPrefill(null);
    try {
      const data = await api.post<PrefillResponse>(`/bookings/${selectedBookingId}/return`, {
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500',
        description,
      });
      setPrefill(data);
      // Pre-fill confirm form with AI suggestions
      const aiScore = data.aiAssessment.overallScore;
      if (aiScore >= 8) {
        setFinalCondition('excellent');
        setFinalAction('ready for reuse');
      } else if (aiScore >= 5) {
        setFinalCondition('good');
        setFinalAction('ready for reuse');
      } else if (aiScore >= 3) {
        setFinalCondition('fair');
        setFinalAction('needs repair');
      } else {
        setFinalCondition('damaged');
        setFinalAction('retire');
      }
      setManagerComment(data.aiAssessment.summary);
      addToast('success', 'AI condition pre-filled successfully!');
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    } finally {
      setLoadingAssess(false);
    }
  };

  const handleConfirmInspection = async () => {
    if (!selectedBookingId) return;
    setSubmitting(true);
    try {
      await api.post(`/bookings/${selectedBookingId}/inspect`, {
        condition: finalCondition,
        action: finalAction,
        managerComment,
      });
      addToast('success', 'Inspection report saved. Asset status updated in database.');
      setPrefill(null);
      setDescription('');
      setPhotoUrl('');
      setManagerComment('');
      loadActiveBookings();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return 'var(--cl-success-400)';
    if (score >= 5) return 'var(--cl-warning-400)';
    return 'var(--cl-danger-400)';
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-lg">
        <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>🔎 Condition Assessment</h1>
        <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
          Lab Manager Portal: Review asset returns, run AI pre-fill assessments, and submit inspection overrides.
        </p>
      </div>

      <div className="page-grid page-grid--2 mb-lg">
        {/* Left Side: Select Booking and Input return details */}
        <div className="glass-card glass-card--static" style={{ padding: 'var(--cl-space-lg)' }}>
          <h3 className="font-bold mb-md" style={{ fontSize: 'var(--cl-font-lg)' }}>
            1. Select Returned Resource
          </h3>

          <div className="form-group mb-md">
            <label className="form-label" htmlFor="select-booking">Active Booking</label>
            {bookings.length === 0 ? (
              <select id="select-booking" className="form-select" disabled>
                <option>No active loans awaiting return</option>
              </select>
            ) : (
              <select
                id="select-booking"
                className="form-select"
                value={selectedBookingId}
                onChange={(e) => {
                  setSelectedBookingId(e.target.value);
                  setPrefill(null);
                }}
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.asset?.name} — Borrowed by {b.user?.email.split('@')[0]}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group mb-md">
            <label className="form-label" htmlFor="return-photo">Return Photo URL</label>
            <input
              id="return-photo"
              className="form-input"
              placeholder="e.g. https://images.unsplash.com/photo..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>

          <div className="form-group mb-md">
            <label className="form-label" htmlFor="return-desc">Student Return Description</label>
            <textarea
              id="return-desc"
              className="form-textarea"
              placeholder="Describe condition details, scratches, stiffness, or other issues reported on return..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: 110 }}
            />
          </div>

          <button
            id="run-assess-submit"
            className="btn btn--primary w-full"
            onClick={handleAssessReturn}
            disabled={loadingAssess || bookings.length === 0 || !description.trim()}
          >
            {loadingAssess ? <span className="spinner" /> : '🤖 Generate AI Prefill Report'}
          </button>
        </div>

        {/* Right Side: AI assessment analysis prefill */}
        <div className="glass-card glass-card--static flex flex-col justify-center items-center" style={{ padding: 'var(--cl-space-lg)' }}>
          {!prefill && !loadingAssess && (
            <div className="text-center" style={{ maxWidth: 320 }}>
              <span style={{ fontSize: 48 }}>🔎</span>
              <h3 className="font-bold mt-md mb-xs" style={{ fontSize: 'var(--cl-font-lg)' }}>
                Waiting for Return Data
              </h3>
              <p className="text-sm text-secondary">
                Select an active student booking and click "Generate AI Prefill Report" to run the visual and text inspection analyzer.
              </p>
            </div>
          )}

          {loadingAssess && (
            <div className="flex flex-col items-center gap-md">
              <div className="spinner spinner--lg" />
              <p className="text-secondary text-sm">AI is processing image and text telemetry...</p>
            </div>
          )}

          {prefill && !loadingAssess && (
            <div className="w-full animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cl-space-md)' }}>
              <div className="flex items-center gap-md" style={{ borderBottom: '1px solid var(--cl-border)', paddingBottom: 'var(--cl-space-sm)' }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    border: `3px solid ${scoreColor(prefill.aiAssessment.overallScore)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: scoreColor(prefill.aiAssessment.overallScore),
                    fontSize: 20
                  }}
                >
                  {prefill.aiAssessment.overallScore}
                </div>
                <div>
                  <h4 className="font-bold">{prefill.assetName}</h4>
                  <div className="text-xs text-muted">Previous Condition: {prefill.previousCondition}</div>
                </div>
              </div>

              <div className="text-xs text-muted">AI Damage Assessment Summary:</div>
              <p className="text-sm text-secondary" style={{ lineHeight: 1.5 }}>
                {prefill.aiAssessment.summary}
              </p>

              <div>
                <div className="text-xs text-muted mb-xs">Findings:</div>
                <div className="flex flex-col gap-xs">
                  {prefill.aiAssessment.details.map((d, idx) => (
                    <div key={idx} className="text-xs text-secondary">• {d}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation and manual override form */}
      {prefill && (
        <div className="glass-card glass-card--static mt-lg animate-slide-up" style={{ padding: 'var(--cl-space-lg)' }}>
          <h3 className="font-bold mb-md" style={{ fontSize: 'var(--cl-font-lg)' }}>
            2. Lab Manager Verification & Override
          </h3>
          <div className="page-grid page-grid--3 mb-md">
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-cond">Confirmed Condition</label>
              <select
                id="confirm-cond"
                className="form-select"
                value={finalCondition}
                onChange={(e) => setFinalCondition(e.target.value)}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-action">Recommended Action</label>
              <select
                id="confirm-action"
                className="form-select"
                value={finalAction}
                onChange={(e) => setFinalAction(e.target.value)}
              >
                <option value="ready for reuse">Ready for Reuse</option>
                <option value="needs repair">Needs Repair</option>
                <option value="retire">Retire</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-comment">Manager Comments / Notes</label>
              <input
                id="confirm-comment"
                className="form-input"
                placeholder="Add inspection notes..."
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-sm">
            <button
              className="btn btn--secondary"
              onClick={() => setPrefill(null)}
            >
              Cancel
            </button>
            <button
              id="confirm-inspect-submit"
              className="btn btn--primary"
              onClick={handleConfirmInspection}
              disabled={submitting}
            >
              {submitting ? <span className="spinner" /> : 'Confirm & Save Inspection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
