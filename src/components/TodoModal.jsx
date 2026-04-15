import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { TEAM_MEMBERS, LABEL_OPTIONS } from '../lib/constants';

export default function TodoModal({ todo, projectId, onClose, onSaved, onDeleted }) {
  const toast = useToast();
  const isNew = !todo;

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    assigned_to: '',
    labels: [],
    deadline: '',
    checklist: [],
    notes: '',
  });
  const [customPerson, setCustomPerson] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (todo) {
      setForm({
        title: todo.title || '',
        description: todo.description || '',
        status: todo.status || 'open',
        priority: todo.priority || 'medium',
        assigned_to: todo.assigned_to || '',
        labels: todo.labels || [],
        deadline: todo.deadline || '',
        checklist: todo.checklist || [],
        notes: todo.notes || '',
      });
      if (todo.assigned_to && !TEAM_MEMBERS.includes(todo.assigned_to)) {
        setCustomPerson(todo.assigned_to);
      }
    }
  }, [todo]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleLabel = (label) => {
    setForm(f => ({
      ...f,
      labels: f.labels.includes(label) ? f.labels.filter(l => l !== label) : [...f.labels, label]
    }));
  };

  const addChecklistItem = () => {
    setForm(f => ({ ...f, checklist: [...f.checklist, { text: '', done: false }] }));
  };

  const updateChecklistItem = (idx, key, val) => {
    setForm(f => {
      const cl = [...f.checklist];
      cl[idx] = { ...cl[idx], [key]: val };
      return { ...f, checklist: cl };
    });
  };

  const removeChecklistItem = (idx) => {
    setForm(f => ({ ...f, checklist: f.checklist.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast('Titel ist erforderlich', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        project_id: projectId,
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        assigned_to: form.assigned_to || null,
        labels: form.labels,
        deadline: form.deadline || null,
        checklist: form.checklist.filter(c => c.text.trim()),
        notes: form.notes,
        completed_at: form.status === 'done' ? new Date().toISOString() : null,
      };

      if (isNew) {
        const { error } = await supabase.from('np_todos').insert(payload);
        if (error) throw error;
        toast('Aufgabe erstellt');
      } else {
        const { error } = await supabase.from('np_todos').update(payload).eq('id', todo.id);
        if (error) throw error;
        toast('Aufgabe aktualisiert');
      }
      onSaved();
    } catch (e) {
      toast(e.message, 'error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Aufgabe wirklich löschen?')) return;
    try {
      await supabase.from('np_todos').delete().eq('id', todo.id);
      toast('Aufgabe gelöscht');
      onDeleted();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div className="modal-title">{isNew ? 'Neue Aufgabe' : 'Aufgabe bearbeiten'}</div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Titel</label>
            <input className="form-input" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Aufgabe..." />
          </div>

          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea className="form-input" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Details..." rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => update('status', e.target.value)}>
                <option value="open">Offen</option>
                <option value="done">Erledigt</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priorität</label>
              <select className="form-input" value={form.priority} onChange={e => update('priority', e.target.value)}>
                <option value="high">Hoch</option>
                <option value="medium">Mittel</option>
                <option value="low">Niedrig</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Zuweisen an</label>
              <select className="form-input" value={TEAM_MEMBERS.includes(form.assigned_to) ? form.assigned_to : '_custom'} onChange={e => {
                if (e.target.value === '_custom') {
                  update('assigned_to', customPerson);
                } else {
                  update('assigned_to', e.target.value);
                  setCustomPerson('');
                }
              }}>
                <option value="">— Niemand —</option>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                <option value="_custom">Andere Person...</option>
              </select>
              {(!TEAM_MEMBERS.includes(form.assigned_to) && form.assigned_to !== '') && (
                <input className="form-input" style={{ marginTop: 6 }} placeholder="Name eingeben..." value={form.assigned_to} onChange={e => { update('assigned_to', e.target.value); setCustomPerson(e.target.value); }} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Labels</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LABEL_OPTIONS.map(l => (
                <label key={l.value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.labels.includes(l.value)} onChange={() => toggleLabel(l.value)} style={{ accentColor: 'var(--primary)' }} />
                  <span className={`label-badge ${l.className}`}>{l.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Checkliste</label>
            {form.checklist.map((item, i) => (
              <div key={i} className={`checklist-item ${item.done ? 'checked' : ''}`}>
                <input type="checkbox" checked={item.done} onChange={e => updateChecklistItem(i, 'done', e.target.checked)} />
                <input type="text" value={item.text} onChange={e => updateChecklistItem(i, 'text', e.target.value)} placeholder="Schritt..." />
                <button onClick={() => removeChecklistItem(i)}>✕</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addChecklistItem} style={{ marginTop: 4 }}>+ Item hinzufügen</button>
          </div>

          <div className="form-group">
            <label className="form-label">Notizen</label>
            <textarea className="form-input" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Notizen..." rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          {!isNew && <button className="btn btn-danger" onClick={handleDelete}>Löschen</button>}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
        </div>
      </div>
    </div>
  );
}
