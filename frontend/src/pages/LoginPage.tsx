import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const QUICK_USERS = [
  { email: 'student_cs@meridian.edu', password: 'student123', label: 'Student (CS)', dot: '#818cf8' },
  { email: 'student_chem@meridian.edu', password: 'student123', label: 'Student (Chem)', dot: '#4ade80' },
  { email: 'cs_manager@meridian.edu', password: 'manager123', label: 'CS Manager', dot: '#f59e0b' },
  { email: 'chem_manager@meridian.edu', password: 'manager123', label: 'Chem Manager', dot: '#f472b6' },
  { email: 'lfofficer@meridian.edu', password: 'officer123', label: 'L&F Officer', dot: '#38bdf8' },
  { email: 'admin@meridian.edu', password: 'admin123', label: 'Admin', dot: '#ef4444' },
];

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleQuickLogin = async (qEmail: string, qPassword: string) => {
    setEmail(qEmail);
    setPassword(qPassword);
    await login(qEmail, qPassword);
  };

  return (
    <div className="login-page">
      <div className="login-card glass-card glass-card--static animate-fade-in">
        <div className="login-card__logo">
          <div className="login-card__logo-icon">C</div>
          <span className="login-card__logo-text">CampusLoop</span>
        </div>

        <p className="login-card__subtitle">
          AI-Powered University Resource Sharing Platform
        </p>

        {error && (
          <div className="toast toast--error" style={{ marginBottom: 16 }} onClick={clearError}>
            <span className="toast__icon">✕</span>
            <span className="toast__message">{error}</span>
          </div>
        )}

        <form className="login-card__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="you@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="login-submit"
            className="btn btn--primary btn--lg w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="login-card__divider">Quick Access (Demo)</div>

        <div className="login-card__quick-users">
          {QUICK_USERS.map((u) => (
            <button
              key={u.email}
              className="quick-user-btn"
              type="button"
              onClick={() => handleQuickLogin(u.email, u.password)}
              disabled={loading}
            >
              <span className="quick-user-btn__dot" style={{ background: u.dot }} />
              {u.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
