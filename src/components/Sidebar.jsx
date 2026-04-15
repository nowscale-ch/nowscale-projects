import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { HUB_URL } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { initials } from '../lib/utils';

// UUID v4 pattern
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractProjectId(pathname) {
  const m = pathname.match(/^\/projects\/([^/]+)/);
  if (m && UUID_RE.test(m[1])) return m[1];
  return null;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { profile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const path = location.pathname;
  const projectId = extractProjectId(path);
  const isProjectMode = !!projectId;

  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!projectId) { setProject(null); return; }
    supabase.from('np_projects').select('id, name, color').eq('id', projectId).single()
      .then(({ data }) => setProject(data));
  }, [projectId]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!profile) return null;

  const activeTab = searchParams.get('tab') || '';
  const isSettings = path.endsWith('/settings');
  const isMeeting = /\/meetings\/[^/]+$/.test(path);

  return (
    <div className="sidebar">
      {isProjectMode ? (
        /* ── Projekt-Navigation ── */
        <>
          <div className="sb-back" onClick={() => navigate('/projects')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="15 18 9 12 15 6"/></svg>
            Alle Projekte
          </div>

          {project && (
            <div className="sb-project-name">
              <span className="sb-project-dot" style={{ background: project.color || 'var(--primary)' }} />
              <span>{project.name}</span>
            </div>
          )}

          <div className="sb-nav">
            <div className="sb-label">Projekt</div>

            <div
              className={`sb-item ${!activeTab && !isSettings && !isMeeting ? 'active' : ''}`}
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Übersicht
            </div>

            <div
              className={`sb-item ${activeTab === 'todos' ? 'active' : ''}`}
              onClick={() => navigate(`/projects/${projectId}?tab=todos`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              To-Dos
            </div>

            <div
              className={`sb-item ${activeTab === 'meetings' || isMeeting ? 'active' : ''}`}
              onClick={() => navigate(`/projects/${projectId}?tab=meetings`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Meetings
            </div>

            <div
              className={`sb-item ${activeTab === 'planning' ? 'active' : ''}`}
              onClick={() => navigate(`/projects/${projectId}?tab=planning`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="16" y1="14" x2="16" y2="18"/></svg>
              Jahresplanung
            </div>

            <div
              className={`sb-item ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => navigate(`/projects/${projectId}?tab=files`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              Dateien
            </div>

            <div className="sb-divider" />

            <div
              className={`sb-item ${isSettings ? 'active' : ''}`}
              onClick={() => navigate(`/projects/${projectId}/settings`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              Einstellungen
            </div>
          </div>
        </>
      ) : (
        /* ── Haupt-Navigation ── */
        <>
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
            <div className={`sb-item ${path === '/projects' ? 'active' : ''}`} onClick={() => navigate('/projects')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              Alle Projekte
            </div>
            <div className={`sb-item ${path === '/projects/new' ? 'active' : ''}`} onClick={() => navigate('/projects/new')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Neues Projekt
            </div>
          </div>
        </>
      )}

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
