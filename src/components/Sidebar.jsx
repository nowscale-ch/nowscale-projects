import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { HUB_URL } from '../lib/constants';
import { initials } from '../lib/utils';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const path = location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!profile) return null;

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <img className="logo-light" src="/logo.webp" alt="NowScale" />
        <img className="logo-dark" src="/logo.webp" alt="NowScale" />
        <span>Projects</span>
      </div>
      <div className="sb-nav">
        <div className="sb-label">Navigation</div>
        <a className="sb-item" href={HUB_URL}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Hub
        </a>
        <div className={`sb-item ${path === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard
        </div>
        <div className={`sb-item ${path === '/projects' || (path.startsWith('/projects/') && !path.includes('new')) ? 'active' : ''}`} onClick={() => navigate('/projects')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Alle Projekte
        </div>
        <div className={`sb-item ${path === '/projects/new' ? 'active' : ''}`} onClick={() => navigate('/projects/new')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Neues Projekt
        </div>
      </div>

      <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dark Mode</span>
        <label className="theme-toggle">
          <input type="checkbox" checked={isDark} onChange={toggleTheme} />
          <span className="theme-slider" />
        </label>
      </div>

      <div className="sb-user" onClick={handleLogout}>
        <div className="sb-avatar">{initials(profile.first_name, profile.last_name)}</div>
        <div className="sb-user-info">
          <div className="sb-user-name">{profile.first_name || ''} {profile.last_name || ''}</div>
          <div className="sb-user-role">{profile.role}</div>
        </div>
        <svg style={{ width: 16, height: 16, color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </div>
    </div>
  );
}
