import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fmtDate } from '../lib/utils';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [todos, setTodos] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [pRes, tRes, mRes] = await Promise.all([
      supabase.from('np_projects').select('*').order('created_at', { ascending: false }),
      supabase.from('np_todos').select('id, project_id, status'),
      supabase.from('np_meetings').select('id, project_id, date, status').order('date', { ascending: true }),
    ]);
    setProjects(pRes.data || []);
    setTodos(tRes.data || []);
    setMeetings(mRes.data || []);
    setLoading(false);
  };

  const getProjectStats = (projectId) => {
    const pTodos = todos.filter(t => t.project_id === projectId);
    const open = pTodos.filter(t => t.status === 'open').length;
    const nextMeeting = meetings.find(m => m.project_id === projectId && m.status === 'planned' && m.date && new Date(m.date) >= new Date());
    return { open, nextMeeting };
  };

  if (loading) return <div className="loading"><div className="spinner" />Laden...</div>;

  return (
    <>
      <div className="page-header">
        <div className="page-title">Alle Projekte</div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Neues Projekt
          </button>
        </div>
      </div>
      <div className="content">
        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>Noch keine Projekte</h3>
            <p>Erstellen Sie Ihr erstes Projekt</p>
            <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>Neues Projekt</button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map(p => {
              const stats = getProjectStats(p.id);
              return (
                <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="project-card-bar" style={{ background: p.color || '#0EA5E9' }} />
                  <div className="project-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3>{p.name}</h3>
                      {p.active && <span className="status-pill status-active" style={{ fontSize: 10 }}>Aktiv</span>}
                      {!p.active && <span className="status-pill status-done" style={{ fontSize: 10 }}>Archiviert</span>}
                    </div>
                    {p.description && <p>{p.description}</p>}
                    <div className="project-card-stats">
                      <div className="project-card-stat">
                        <div className="project-card-stat-value">{stats.open}</div>
                        <div className="project-card-stat-label">Offene Aufgaben</div>
                      </div>
                      <div className="project-card-stat">
                        <div className="project-card-stat-value">{stats.nextMeeting ? fmtDate(stats.nextMeeting.date) : '—'}</div>
                        <div className="project-card-stat-label">Nächstes Meeting</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
