import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { fmtDate, isOverdue } from '../lib/utils';
import { LABEL_OPTIONS } from '../lib/constants';
import TodoModal from '../components/TodoModal';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [todos, setTodos] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [todoModal, setTodoModal] = useState(null); // null=closed, false=new, object=edit
  const [showDone, setShowDone] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [newMeeting, setNewMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', participants: '' });

  const loadData = useCallback(async () => {
    const [pRes, tRes, mRes] = await Promise.all([
      supabase.from('np_projects').select('*').eq('id', id).single(),
      supabase.from('np_todos').select('*').eq('project_id', id).order('sort_order', { ascending: true }),
      supabase.from('np_meetings').select('*').eq('project_id', id).order('date', { ascending: false }),
    ]);
    setProject(pRes.data);
    setTodos(tRes.data || []);
    setMeetings(mRes.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleTodo = async (todo) => {
    const newStatus = todo.status === 'open' ? 'done' : 'open';
    await supabase.from('np_todos').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', todo.id);
    loadData();
  };

  const createMeeting = async () => {
    if (!meetingForm.title.trim()) { toast('Meeting-Titel erforderlich', 'error'); return; }
    const { error } = await supabase.from('np_meetings').insert({
      project_id: id,
      title: meetingForm.title,
      date: meetingForm.date || null,
      participants: meetingForm.participants,
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Meeting erstellt');
    setNewMeeting(false);
    setMeetingForm({ title: '', date: '', participants: '' });
    loadData();
  };

  if (loading) return <div className="loading"><div className="spinner" />Laden...</div>;
  if (!project) return <div className="content"><div className="empty-state"><h3>Projekt nicht gefunden</h3></div></div>;

  const openTodos = todos.filter(t => t.status === 'open');
  const doneTodos = todos.filter(t => t.status === 'done');
  const donePercent = todos.length > 0 ? Math.round(doneTodos.length / todos.length * 100) : 0;
  const nextMeeting = meetings.find(m => m.status === 'planned' && m.date && new Date(m.date) >= new Date());

  // Filter & sort
  let filteredTodos = openTodos;
  if (filterPriority) filteredTodos = filteredTodos.filter(t => t.priority === filterPriority);
  if (filterPerson) filteredTodos = filteredTodos.filter(t => t.assigned_to === filterPerson);
  if (filterLabel) filteredTodos = filteredTodos.filter(t => (t.labels || []).includes(filterLabel));

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  if (sortBy === 'priority') filteredTodos.sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1));
  else if (sortBy === 'deadline') filteredTodos.sort((a, b) => (a.deadline || '9999') > (b.deadline || '9999') ? 1 : -1);
  else if (sortBy === 'person') filteredTodos.sort((a, b) => (a.assigned_to || '').localeCompare(b.assigned_to || ''));

  const people = [...new Set(todos.map(t => t.assigned_to).filter(Boolean))];

  return (
    <>
      <div className="detail-header">
        <div className="detail-breadcrumb">
          <a onClick={() => navigate('/projects')}>Projekte</a>
          <span>/</span>
          <span>{project.name}</span>
        </div>
        <div className="detail-title-row">
          <div className="detail-title">{project.name}</div>
          <span className={`status-pill ${project.active ? 'status-active' : 'status-done'}`}>
            {project.active ? 'Aktiv' : 'Archiviert'}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}/settings`)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              Einstellungen
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        {['dashboard', 'todos', 'meetings', 'files'].map(tab => (
          <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'todos' && <>📋 To-Dos <span className="tab-count">{openTodos.length}</span></>}
            {tab === 'meetings' && <>📅 Meetings <span className="tab-count">{meetings.length}</span></>}
            {tab === 'files' && '📁 Dateien'}
          </div>
        ))}
      </div>

      <div className="content">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-value">{openTodos.length}</div>
                <div className="kpi-label">Offene Aufgaben</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{donePercent}%</div>
                <div className="kpi-label">Erledigt</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{nextMeeting ? fmtDate(nextMeeting.date) : '—'}</div>
                <div className="kpi-label">Nächstes Meeting</div>
              </div>
            </div>
            <div className="section-card">
              <h3>Letzte Aufgaben</h3>
              {todos.slice(0, 5).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className={`priority-dot ${t.priority}`} />
                  <span style={{ fontSize: 13, flex: 1 }}>{t.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.assigned_to || ''}</span>
                  <span className={`status-pill ${t.status === 'done' ? 'status-done' : 'status-active'}`} style={{ fontSize: 10 }}>
                    {t.status === 'done' ? 'Erledigt' : 'Offen'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TODOS TAB */}
        {activeTab === 'todos' && (
          <>
            <div className="filter-bar">
              <button className="btn btn-primary btn-sm" onClick={() => setTodoModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Neue Aufgabe
              </button>
              <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="priority">Sortierung: Priorität</option>
                <option value="deadline">Sortierung: Deadline</option>
                <option value="person">Sortierung: Person</option>
              </select>
              <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="">Alle Prioritäten</option>
                <option value="high">Hoch</option>
                <option value="medium">Mittel</option>
                <option value="low">Niedrig</option>
              </select>
              <select className="filter-select" value={filterPerson} onChange={e => setFilterPerson(e.target.value)}>
                <option value="">Alle Personen</option>
                {people.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="filter-select" value={filterLabel} onChange={e => setFilterLabel(e.target.value)}>
                <option value="">Alle Labels</option>
                {LABEL_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginLeft: 'auto', cursor: 'pointer' }}>
                <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                Erledigte anzeigen
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredTodos.length === 0 && <div className="empty-state"><p>Keine offenen Aufgaben</p></div>}
              {filteredTodos.map(t => (
                <div key={t.id} className="todo-item" onClick={() => setTodoModal(t)}>
                  <div className={`todo-checkbox ${t.status === 'done' ? 'checked' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleTodo(t); }}>
                    {t.status === 'done' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div className="todo-content">
                    <div className="todo-title">{t.title}</div>
                    <div className="todo-meta">
                      <span className={`priority-dot ${t.priority}`} />
                      {t.assigned_to && <span>👤 {t.assigned_to}</span>}
                      {t.deadline && <span style={{ color: isOverdue(t.deadline) ? 'var(--danger)' : undefined }}>📅 {fmtDate(t.deadline)}</span>}
                      {(t.labels || []).map(l => {
                        const opt = LABEL_OPTIONS.find(o => o.value === l);
                        return opt ? <span key={l} className={`label-badge ${opt.className}`}>{l}</span> : null;
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {showDone && doneTodos.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginTop: 16, marginBottom: 4 }}>Erledigte Aufgaben ({doneTodos.length})</div>
                  {doneTodos.map(t => (
                    <div key={t.id} className="todo-item done" onClick={() => setTodoModal(t)}>
                      <div className="todo-checkbox checked"
                        onClick={e => { e.stopPropagation(); toggleTodo(t); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div className="todo-content">
                        <div className="todo-title">{t.title}</div>
                        <div className="todo-meta">
                          {t.assigned_to && <span>👤 {t.assigned_to}</span>}
                          {t.completed_at && <span>✅ {fmtDate(t.completed_at)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {todoModal !== null && (
              <TodoModal
                todo={todoModal || undefined}
                projectId={id}
                onClose={() => setTodoModal(null)}
                onSaved={() => { setTodoModal(null); loadData(); }}
                onDeleted={() => { setTodoModal(null); loadData(); }}
              />
            )}
          </>
        )}

        {/* MEETINGS TAB */}
        {activeTab === 'meetings' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setNewMeeting(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Neues Meeting
              </button>
            </div>

            {newMeeting && (
              <div className="section-card" style={{ marginBottom: 16 }}>
                <h3>Neues Meeting</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Titel</label>
                    <input className="form-input" value={meetingForm.title} onChange={e => setMeetingForm(f => ({ ...f, title: e.target.value }))} placeholder="z.B. Kickoff Meeting" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Datum & Zeit</label>
                    <input className="form-input" type="datetime-local" value={meetingForm.date} onChange={e => setMeetingForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teilnehmer</label>
                    <input className="form-input" value={meetingForm.participants} onChange={e => setMeetingForm(f => ({ ...f, participants: e.target.value }))} placeholder="Simon, Michael, Kunde" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setNewMeeting(false)}>Abbrechen</button>
                  <button className="btn btn-primary btn-sm" onClick={createMeeting}>Erstellen</button>
                </div>
              </div>
            )}

            {meetings.length === 0 && <div className="empty-state"><h3>Noch keine Meetings</h3><p>Erstellen Sie Ihr erstes Meeting</p></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {meetings.map(m => (
                <div key={m.id} className="meeting-card" onClick={() => navigate(`/projects/${id}/meetings/${m.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4>{m.title}</h4>
                    <span className={`status-pill ${m.status === 'done' ? 'status-done' : 'status-planned'}`} style={{ fontSize: 10 }}>
                      {m.status === 'done' ? 'Erledigt' : 'Geplant'}
                    </span>
                  </div>
                  {m.date && <div className="meeting-date">{fmtDate(m.date)}</div>}
                  <div className="meeting-meta">
                    {m.participants && <span>👥 {m.participants}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <>
            {project.drive_link ? (
              <a href={project.drive_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="drive-card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 19.5h20L12 2z" fill="none"/>
                    <path d="M7.5 12l4.5 7.5L16.5 12" fill="none"/>
                  </svg>
                  <h3>Google Drive öffnen</h3>
                  <p>Projekt-Dateien in Google Drive anzeigen</p>
                </div>
              </a>
            ) : (
              <div className="empty-state">
                <h3>Noch kein Drive-Ordner verknüpft</h3>
                <p>Fügen Sie einen Google Drive Link in den Projekteinstellungen hinzu</p>
                <button className="btn btn-primary" onClick={() => navigate(`/projects/${id}/settings`)}>Projekteinstellungen</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
