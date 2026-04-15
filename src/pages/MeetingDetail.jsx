import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { fmtDate } from '../lib/utils';
import { TEAM_MEMBERS } from '../lib/constants';

export default function MeetingDetail() {
  const { id: projectId, meetingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [meeting, setMeeting] = useState(null);
  const [project, setProject] = useState(null);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [meetingTodos, setMeetingTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Manual completed items (not linked to To-Do list)
  const [manualItems, setManualItems] = useState([]);
  const [newManualItem, setNewManualItem] = useState('');

  // New todo inline
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPerson, setNewTodoPerson] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium');

  const loadData = useCallback(async () => {
    // Load meeting, project, all meetings (for date range), and meeting todos
    const [mRes, pRes, allMeetingsRes, mtRes] = await Promise.all([
      supabase.from('np_meetings').select('*').eq('id', meetingId).single(),
      supabase.from('np_projects').select('*').eq('id', projectId).single(),
      supabase.from('np_meetings').select('id, date, title').eq('project_id', projectId).order('date', { ascending: true }),
      supabase.from('np_meeting_todos').select('*, np_todos(*)').eq('meeting_id', meetingId),
    ]);

    const currentMeeting = mRes.data;
    setMeeting(currentMeeting);
    setProject(pRes.data);
    setMeetingTodos(mtRes.data || []);

    // Find previous meeting date
    const allMeetings = allMeetingsRes.data || [];
    const currentIdx = allMeetings.findIndex(m => m.id === meetingId);
    const prevMeeting = currentIdx > 0 ? allMeetings[currentIdx - 1] : null;
    const prevDate = prevMeeting?.date || '1970-01-01T00:00:00Z';
    const currentDate = currentMeeting?.date || new Date().toISOString();

    // Load completed todos between prev meeting and this meeting
    let query = supabase
      .from('np_todos')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'done')
      .gte('completed_at', prevDate)
      .lte('completed_at', currentDate)
      .order('completed_at', { ascending: false });

    const tRes = await query;
    setCompletedTodos(tRes.data || []);

    // Load manual items from meeting notes (stored as JSON in preparation_notes or a separate field)
    if (currentMeeting?.manual_completed_items) {
      try {
        setManualItems(JSON.parse(currentMeeting.manual_completed_items));
      } catch { setManualItems([]); }
    }

    setLoading(false);
  }, [meetingId, projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const [form, setForm] = useState({
    agenda: '', preparation_notes: '', protocol: '', decisions: '', notes: '',
  });

  useEffect(() => {
    if (meeting) {
      setForm({
        agenda: meeting.agenda || '',
        preparation_notes: meeting.preparation_notes || '',
        protocol: meeting.protocol || '',
        decisions: meeting.decisions || '',
        notes: meeting.notes || '',
      });
    }
  }, [meeting]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addManualItem = () => {
    if (!newManualItem.trim()) return;
    const updated = [...manualItems, newManualItem.trim()];
    setManualItems(updated);
    setNewManualItem('');
  };

  const removeManualItem = (idx) => {
    setManualItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('np_meetings').update({
        agenda: form.agenda,
        preparation_notes: form.preparation_notes,
        protocol: form.protocol,
        decisions: form.decisions,
        notes: form.notes,
        manual_completed_items: JSON.stringify(manualItems),
      }).eq('id', meetingId);
      if (error) throw error;
      toast('Gespeichert');
    } catch (e) {
      toast(e.message, 'error');
    }
    setSaving(false);
  };

  const completeMeeting = async () => {
    try {
      await supabase.from('np_meetings').update({ status: 'done' }).eq('id', meetingId);
      toast('Meeting abgeschlossen');
      loadData();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const toggleTodoDone = async (todo) => {
    const newStatus = todo.status === 'open' ? 'done' : 'open';
    await supabase.from('np_todos').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', todo.id);

    if (newStatus === 'done') {
      const existing = meetingTodos.find(mt => mt.todo_id === todo.id);
      if (!existing) {
        await supabase.from('np_meeting_todos').insert({ meeting_id: meetingId, todo_id: todo.id, type: 'completed' });
      }
    }
    loadData();
  };

  const addNewTodo = async () => {
    if (!newTodoTitle.trim()) return;
    try {
      const { data: todo, error } = await supabase.from('np_todos').insert({
        project_id: projectId,
        title: newTodoTitle,
        assigned_to: newTodoPerson || null,
        priority: newTodoPriority,
      }).select().single();
      if (error) throw error;

      await supabase.from('np_meeting_todos').insert({
        meeting_id: meetingId,
        todo_id: todo.id,
        type: 'new',
      });

      setNewTodoTitle('');
      setNewTodoPerson('');
      setNewTodoPriority('medium');
      toast('Aufgabe erstellt');
      loadData();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" />Laden...</div>;
  if (!meeting || !project) return <div className="content"><div className="empty-state"><h3>Meeting nicht gefunden</h3></div></div>;

  const newInMeeting = meetingTodos.filter(mt => mt.type === 'new').map(mt => mt.np_todos).filter(Boolean);

  return (
    <>
      <div className="detail-header">
        <div className="detail-breadcrumb">
          <a onClick={() => navigate('/projects')}>Projekte</a>
          <span>/</span>
          <a onClick={() => navigate(`/projects/${projectId}`)}>{project.name}</a>
          <span>/</span>
          <span>{meeting.title}</span>
        </div>
        <div className="detail-title-row">
          <div className="detail-title">{meeting.title}</div>
          <span className={`status-pill ${meeting.status === 'done' ? 'status-done' : 'status-planned'}`}>
            {meeting.status === 'done' ? 'Erledigt' : 'Geplant'}
          </span>
        </div>
        <div className="detail-meta">
          {meeting.date && <div className="detail-meta-item">📅 {fmtDate(meeting.date)}</div>}
          {meeting.participants && <div className="detail-meta-item">👥 {meeting.participants}</div>}
        </div>
      </div>

      <div className="content">
        {/* Vorbereitung */}
        <div className="section-card">
          <h3>📋 Vorbereitung</h3>
          <div className="form-group">
            <label className="form-label">Agenda</label>
            <textarea className="form-input" value={form.agenda} onChange={e => update('agenda', e.target.value)} placeholder="Agenda-Punkte..." rows={4} />
          </div>

          <div className="form-group">
            <label className="form-label">Erledigte Aufgaben seit letztem Meeting</label>
            {completedTodos.length === 0 && manualItems.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Keine erledigten Aufgaben im Zeitraum</p>
            )}
            {completedTodos.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--primary)', fontSize: 14 }}>✅</span>
                <span className={`priority-dot ${t.priority}`} />
                <span style={{ fontSize: 13, flex: 1 }}>{t.title}</span>
                {t.assigned_to && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.assigned_to}</span>}
                {t.completed_at && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(t.completed_at)}</span>}
              </div>
            ))}
            {manualItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--primary)', fontSize: 14 }}>✅</span>
                <span style={{ fontSize: 13, flex: 1 }}>{item}</span>
                <button onClick={() => removeManualItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="form-input" style={{ flex: 1 }} value={newManualItem} onChange={e => setNewManualItem(e.target.value)} placeholder="Weitere erledigte Aufgabe hinzufügen..." onKeyDown={e => e.key === 'Enter' && addManualItem()} />
              <button className="btn btn-ghost btn-sm" onClick={addManualItem}>+</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Vorbereitungs-Notizen</label>
            <textarea className="form-input" value={form.preparation_notes} onChange={e => update('preparation_notes', e.target.value)} placeholder="Notizen zur Vorbereitung..." rows={3} />
          </div>
        </div>

        {/* Protokoll */}
        <div className="section-card">
          <h3>📝 Protokoll</h3>
          <div className="form-group">
            <label className="form-label">Freitext-Protokoll</label>
            <textarea className="form-input" value={form.protocol} onChange={e => update('protocol', e.target.value)} placeholder="Meeting-Notizen, Diskussionen..." rows={8} style={{ minHeight: 200 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Beschlüsse / Entscheide</label>
            <textarea className="form-input" value={form.decisions} onChange={e => update('decisions', e.target.value)} placeholder="Entscheide und Beschlüsse..." rows={4} />
          </div>
        </div>

        {/* Aufgaben */}
        <div className="section-card">
          <h3>✅ Neue Aufgaben</h3>

          {newInMeeting.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Im Meeting erstellte Aufgaben</div>
              {newInMeeting.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                  <span className={`priority-dot ${t.priority}`} />
                  {t.title}
                  {t.assigned_to && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→ {t.assigned_to}</span>}
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Neue Aufgabe erstellen</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <input className="form-input" style={{ flex: 2, minWidth: 200 }} value={newTodoTitle} onChange={e => setNewTodoTitle(e.target.value)} placeholder="Titel..." />
            <select className="form-input" style={{ flex: 1, minWidth: 120 }} value={newTodoPerson} onChange={e => setNewTodoPerson(e.target.value)}>
              <option value="">Person...</option>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="form-input" style={{ width: 100 }} value={newTodoPriority} onChange={e => setNewTodoPriority(e.target.value)}>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={addNewTodo}>Hinzufügen</button>
          </div>
        </div>

        {/* Notizen */}
        <div className="section-card">
          <h3>📌 Notizen</h3>
          <textarea className="form-input" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Allgemeine Notizen..." rows={4} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
          {meeting.status !== 'done' && (
            <button className="btn btn-ghost" onClick={completeMeeting}>Meeting abschliessen</button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate(`/projects/${projectId}`)} style={{ marginLeft: 'auto' }}>
            Zurück zum Projekt
          </button>
        </div>
      </div>
    </>
  );
}
