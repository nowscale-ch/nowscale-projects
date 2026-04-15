import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { slugify } from '../lib/utils';

export default function ProjectNew() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', description: '', drive_link: '', color: '#0EA5E9' });
  const [saving, setSaving] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Projektname ist erforderlich', 'error'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('np_projects').insert({
        name: form.name,
        slug: slugify(form.name),
        description: form.description,
        drive_link: form.drive_link,
        color: form.color,
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      toast('Projekt erstellt');
      navigate(`/projects/${data.id}`);
    } catch (e) {
      toast(e.message, 'error');
    }
    setSaving(false);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Neues Projekt</div>
      </div>
      <div className="content">
        <div className="section-card" style={{ maxWidth: 600 }}>
          <div className="form-group">
            <label className="form-label">Projektname</label>
            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="z.B. Kunde XY — Website Relaunch" />
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea className="form-input" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Kurze Beschreibung..." rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Google Drive Link</label>
            <input className="form-input" value={form.drive_link} onChange={e => update('drive_link', e.target.value)} placeholder="https://drive.google.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Farbe</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={form.color} onChange={e => update('color', e.target.value)} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{form.color}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/projects')}>Abbrechen</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Speichern...' : 'Projekt erstellen'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
