import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToastStore } from '../stores/toastStore';
import type { StudyGroupInterest, StudyGroupMatch } from '../types';

export default function StudyGroupsPage() {
  const [interests, setInterests] = useState<StudyGroupInterest[]>([]);
  const [matches, setMatches] = useState<StudyGroupMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<StudyGroupInterest | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({
    moduleCode: '',
    preferredStyle: 'group',
    availabilitySlots: [] as string[],
  });
  const { addToast } = useToastStore();

  const SLOTS = ['Mon AM', 'Mon PM', 'Tue AM', 'Tue PM', 'Wed AM', 'Wed PM', 'Thu AM', 'Thu PM', 'Fri AM', 'Fri PM'];

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      const data = await api.get<StudyGroupInterest[]>('/study-groups/interests');
      setInterests(data);
      if (data.length > 0 && !selectedInterest) {
        setSelectedInterest(data[0]);
      }
    } catch {
      addToast('error', 'Failed to load study group interests');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await api.post('/study-groups/interests', {
        moduleCode: form.moduleCode,
        preferredStyle: form.preferredStyle,
        availabilitySlots: form.availabilitySlots,
      });
      addToast('success', 'Study interest registered!');
      setShowRegister(false);
      setForm({ moduleCode: '', preferredStyle: 'group', availabilitySlots: [] });
      loadInterests();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const handleFindMatches = async () => {
    if (!selectedInterest) {
      addToast('warning', 'Please select a registered interest to match first');
      return;
    }
    setMatching(true);
    setMatches([]);
    try {
      const data = await api.get<StudyGroupMatch[]>(`/study-groups/matches/${selectedInterest.moduleCode}`);
      setMatches(data);
      if (data.length > 0) {
        addToast('success', `Found ${data.length} compatible study partners!`);
      } else {
        addToast('info', 'No matching partners found at the moment.');
      }
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    } finally {
      setMatching(false);
    }
  };

  const handleInvite = async (inviteeUserId: string) => {
    if (!selectedInterest) return;
    try {
      await api.post('/study-groups/invite', {
        moduleCode: selectedInterest.moduleCode,
        inviteeUserId,
      });
      addToast('success', 'Invitation sent via real-time WebSocket!');
      loadInterests();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const toggleSlot = (slot: string) => {
    setForm((f) => ({
      ...f,
      availabilitySlots: f.availabilitySlots.includes(slot)
        ? f.availabilitySlots.filter((s) => s !== slot)
        : [...f.availabilitySlots, slot],
    }));
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
          <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>📚 Study Groups</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            Match with classmates for study sessions using AI-driven schedule and preference alignment
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowRegister(true)}>
          + Register Interest
        </button>
      </div>

      <div className="page-grid page-grid--2 mb-lg">
        {/* Left Side: My Interests */}
        <div className="glass-card glass-card--static" style={{ padding: 'var(--cl-space-lg)' }}>
          <h3 className="font-bold mb-md" style={{ fontSize: 'var(--cl-font-lg)' }}>
            My Registered Interests
          </h3>
          {interests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📚</div>
              <div className="empty-state__title">No interests registered</div>
              <p className="text-muted text-sm">Register a module/course first to find study peers</p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {interests.map((interest) => (
                <div
                  key={interest.id}
                  onClick={() => {
                    setSelectedInterest(interest);
                    setMatches([]);
                  }}
                  className={`glass-card`}
                  style={{
                    padding: 'var(--cl-space-md)',
                    cursor: 'pointer',
                    borderColor: selectedInterest?.id === interest.id ? 'var(--cl-primary-500)' : 'var(--cl-border)',
                    background: selectedInterest?.id === interest.id ? 'rgba(99, 102, 241, 0.05)' : 'var(--cl-bg-card)',
                  }}
                >
                  <div className="flex items-center justify-between mb-sm">
                    <span className="font-bold">{interest.moduleCode}</span>
                    <span className={`badge ${interest.status === 'matched' ? 'badge--success' : 'badge--warning'}`}>
                      {interest.status === 'matched' ? 'Matched' : 'Searching'}
                    </span>
                  </div>
                  <div className="text-xs text-secondary mb-xs">
                    Style: <span className="font-semibold">{interest.preferredStyle}</span>
                  </div>
                  <div className="flex gap-xs flex-wrap mt-sm">
                    {interest.availabilitySlots.map((s) => (
                      <span key={s} className="badge badge--neutral" style={{ fontSize: 9 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Finder Action */}
        <div className="glass-card glass-card--static flex flex-col justify-center items-center" style={{ padding: 'var(--cl-space-lg)' }}>
          <div className="text-center" style={{ maxWidth: 320 }}>
            <span style={{ fontSize: 48 }}>🤖</span>
            <h3 className="font-bold mt-md mb-xs" style={{ fontSize: 'var(--cl-font-lg)' }}>
              AI Matcher Panel
            </h3>
            <p className="text-sm text-secondary mb-lg">
              {selectedInterest
                ? `Click match to find compatible study partners for ${selectedInterest.moduleCode}.`
                : 'Select an interest from the list to start matching.'}
            </p>
            <button
              className="btn btn--primary btn--lg w-full"
              onClick={handleFindMatches}
              disabled={matching || !selectedInterest}
            >
              {matching ? <span className="spinner" /> : '🤖 Scan Compatible Classmates'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Matches */}
      {matches.length > 0 && (
        <div className="mb-lg animate-slide-up">
          <h2 className="font-bold mb-md" style={{ fontSize: 'var(--cl-font-lg)' }}>
            ✨ Best Match Results
          </h2>
          <div className="page-grid page-grid--2">
            {matches.map((m, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: 'var(--cl-space-lg)',
                  borderLeft: '4px solid var(--cl-primary-500)',
                }}
              >
                <div className="flex items-center justify-between mb-md">
                  <div className="flex items-center gap-sm">
                    <div className="app-sidebar__avatar" style={{ width: 36, height: 36 }}>
                      {m.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-bold">{m.email}</div>
                      <div className="text-xs text-secondary">Style: {m.preferredStyle}</div>
                    </div>
                  </div>
                  <span className="badge badge--warning">
                    ★ {m.compatibilityScore}% Compatible
                  </span>
                </div>

                <div className="condition-meter mb-md">
                  <div
                    className="condition-meter__fill"
                    style={{
                      width: `${m.compatibilityScore}%`,
                      background: 'linear-gradient(90deg, var(--cl-primary-400), var(--cl-accent-400))',
                    }}
                  />
                </div>

                <p className="text-xs text-secondary mb-md" style={{ lineHeight: 1.6 }}>
                  💡 {m.rationale}
                </p>

                <div className="mb-md">
                  <div className="text-xs text-muted mb-xs">Suggested Slots</div>
                  <div className="flex gap-xs flex-wrap">
                    {m.slots.map((slot) => (
                      <span key={slot} className="badge badge--success" style={{ fontSize: 10 }}>
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn--primary btn--sm w-full"
                  onClick={() => handleInvite(m.userId)}
                >
                  ✉ Send Invitation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register modal */}
      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Register Study Interest</h3>
              <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setShowRegister(false)}>×</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label" htmlFor="group-module">Module / Course Code</label>
                <input id="group-module" className="form-input" placeholder="e.g. CS301" value={form.moduleCode} onChange={(e) => setForm(f => ({ ...f, moduleCode: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="group-style">Preferred Study Style</label>
                <select id="group-style" className="form-select" value={form.preferredStyle} onChange={(e) => setForm(f => ({ ...f, preferredStyle: e.target.value }))}>
                  <option value="group">Group Study (Collaborative)</option>
                  <option value="solo">Solo Study (Silent)</option>
                  <option value="discussion">Discussion-Based</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Availability Slots (select all that apply)</label>
                <div className="flex gap-sm flex-wrap">
                  {SLOTS.map((slot) => (
                    <button
                      key={slot}
                      className={`chip ${form.availabilitySlots.includes(slot) ? 'chip--selected' : ''}`}
                      onClick={() => toggleSlot(slot)}
                      type="button"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowRegister(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleRegister} disabled={!form.moduleCode || form.availabilitySlots.length === 0}>Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
