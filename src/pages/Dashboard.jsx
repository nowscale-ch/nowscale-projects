import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fmtDate, isOverdue, isThisWeek } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [todos, setTodos] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [pRes, tRes, mRes] = await Promise.all([
      supabase.from('np_projects').select('*').eq('active', true).order('created_at', { ascending: false }),
      supabase.from('np_todos').select('*, np_projects(name, color)').order('created_at', { ascending: false }),
      supabase.from('np_meetings').select('*, np_projects(name, color)').order('date', { ascending: true }),
    ]);
    setProjects(pRes.data || []);
    setTodos(tRes.data || []);
    setMeetings(mRes.data || []);
    setLoading(false);
  };

  const activeProjects = projects.length;
  const openTodos = todos.filter(t => t.status === 'open').length;
  const overdueTodos = todos.filter(t => t.status === 'open' && isOverdue(t.deadline)).length;
  const weekMeetings = meetings.filter(m => isThisWeek(m.date)).length;

  const recentTodos = todos.slice(0, 8);
  const upcomingMeetings = meetings.filter(m => m.status === 'planned' && m.date && new Date(m.date) >= new Date()).slice(0, 5);

  if (loading) return <div className="loading"><div className="spinner" />Laden...</div>;

  return (
    <>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
      </div>
      <div className="content">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            </div>
            <div className="kpi-value">{activeProjects}</div>
            <div className="kpi-label">Aktive Projekte</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <div className="kpi-value">{openTodos}</div>
            <div className="kpi-label">Offene Aufgaben</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="kpi-value">{overdueTodos}</div>
            <div className="kpi-label">Überfällige Aufgaben</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="kpi-value">{weekMeetings}</div>
            <div className="kpi-label">Meetings diese Woche</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="section-card">
            <h3>Letzte Aufgaben</h3>
            {recentTodos.length === 0 && <div className="empty-state"><p>Noch keine Aufgaben</p></div>}
            {recentTodos.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${t.project_id}`)}>
                <span className={`priority-dot ${t.priority}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.np_projects?.name}</div>
                </div>
                {t.status === 'done' && <span className="status-pill status-done" style={{ fontSize: 10 }}>Erledigt</span>}
                {t.deadline && <span style={{ fontSize: 11, color: isOverdue(t.deadline) ? 'var(--danger)' : 'var(--text-muted)' }}>{fmtDate(t.deadline)}</span>}
              </div>
            ))}
          </div>

          <div className="section-card">
            <h3>Nächste Meetings</h3>
            {upcomingMeetings.length === 0 && <div className="empty-state"><p>Keine geplanten Meetings</p></div>}
            {upcomingMeetings.map(m => (
              <div key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${m.project_id}/meetings/${m.id}`)}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2 }}>{fmtDate(m.date)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.np_projects?.name} {m.participants ? `· ${m.participants}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
