import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  roles: Role[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['student', 'staff', 'lfofficer', 'admin'] },
  { id: 'assets', label: 'Assets', icon: '🔬', roles: ['student', 'staff', 'admin'] },
  { id: 'bookings', label: 'My Bookings', icon: '📅', roles: ['student', 'staff', 'admin'] },
  { id: 'peer-lending', label: 'Peer Lending', icon: '🤝', roles: ['student'] },
  { id: 'lost-found', label: 'Lost & Found', icon: '🔍', roles: ['student', 'lfofficer', 'admin'] },
  { id: 'study-groups', label: 'Study Groups', icon: '📚', roles: ['student'] },
  { id: 'ai-search', label: 'AI Search', icon: '✨', roles: ['student', 'staff', 'admin'] },
  { id: 'condition', label: 'Condition Check', icon: '🔎', roles: ['staff', 'admin'] },
  { id: 'anomalies', label: 'Anomaly Detector', icon: '📈', roles: ['admin'] },
  { id: 'manage-assets', label: 'Manage Assets', icon: '⚙️', roles: ['staff', 'admin'] },
  { id: 'analytics', label: 'Analytics', icon: '📉', roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  const mainItems = visibleItems.filter((item) =>
    ['dashboard', 'assets', 'bookings', 'peer-lending', 'lost-found', 'study-groups'].includes(item.id)
  );

  const aiItems = visibleItems.filter((item) =>
    ['ai-search', 'condition', 'anomalies'].includes(item.id)
  );

  const adminItems = visibleItems.filter((item) =>
    ['manage-assets', 'analytics'].includes(item.id)
  );

  const initials =
    (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

  return (
    <aside className="app-sidebar" id="app-sidebar">
      <div className="app-sidebar__logo">
        <div className="app-sidebar__logo-icon">C</div>
        <span className="app-sidebar__logo-text">CampusLoop</span>
      </div>

      <nav className="app-sidebar__nav">
        {mainItems.length > 0 && (
          <>
            <span className="app-sidebar__section-title">Main</span>
            {mainItems.map((item) => (
              <NavLink
                key={item.id}
                id={`nav-${item.id}`}
                to={`/${item.id}`}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              >
                <span className="sidebar-link__icon">{item.icon}</span>
                {item.label}
                {item.badge ? (
                  <span className="sidebar-link__badge">{item.badge}</span>
                ) : null}
              </NavLink>
            ))}
          </>
        )}

        {aiItems.length > 0 && (
          <>
            <span className="app-sidebar__section-title">AI Features</span>
            {aiItems.map((item) => (
              <NavLink
                key={item.id}
                id={`nav-${item.id}`}
                to={`/${item.id}`}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              >
                <span className="sidebar-link__icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}

        {adminItems.length > 0 && (
          <>
            <span className="app-sidebar__section-title">Management</span>
            {adminItems.map((item) => (
              <NavLink
                key={item.id}
                id={`nav-${item.id}`}
                to={`/${item.id}`}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              >
                <span className="sidebar-link__icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="app-sidebar__footer">
        <div className="app-sidebar__user" onClick={logout} title="Sign out">
          <div className="app-sidebar__avatar">{initials}</div>
          <div className="app-sidebar__user-info">
            <div className="app-sidebar__user-name">
              {user.firstName} {user.lastName}
            </div>
            <div className="app-sidebar__user-role">{user.role.replace('_', ' ')}</div>
          </div>
          <span style={{ fontSize: 18, color: 'var(--cl-text-muted)' }}>⏻</span>
        </div>
      </div>
    </aside>
  );
}
