import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

export default function ProjectSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [access, setAccess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', drive_link: '', color: '#0EA5E9' });

  const loadData = useCallback(async () => {
    const [pRes, aRes] = await Promise.all([
      supabase.from('np_projects').select('*').eq('id', id).single(),
      supabase.from('np_project_access').select('*, profiles:user_id(id, first_name, last_name, email)').eq('project_id', id),
    ]);
    setProject(pRes.data);
    setAccess(aRes.data || []);
    if (pRes.data) {
      setForm({
        name: pRes.data.name || '',
        description: pRes.data.description || '',
        drive_link: pRes.data.drive_link || '',
        color: pRes.data.color || '#0EA5E9',
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Projektname erforderlich', 'error'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('np_projects').update({
        name: form.name,
        description: form.description,
        drive_link: form.drive_link,
        color: form.color,
      }).eq('id', id);
      if (error) throw error;
      toast('Projekt aktualisiert');
    } catch (e) {
      toast(e.message, 'error');
    }
    setSaving(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      // Try to find existing user
      const { data: existingProfiles } = await supabase.from('profiles').select('id').eq('email', inviteEmail).maybeSingle();

      let userId;
      if (existingProfiles) {
        userId = existingProfiles.id;
      } else {
        // Create new user via signUp (they'll need to confirm)
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: inviteEmail,
          password: tempPassword,
        });
        if (signUpErr) throw signUpErr;
        userId = signUpData.user?.id;
      }

      if (userId) {
        const { error } = await supabase.from('np_project_access').upsert({
          project_id: id,
          user_id: userId,
          role: 'viewer',
        });
        if (error) throw error;
        toast('Benutzer eingeladen');
        setInviteEmail('');
        loadData();
      }
    } catch (e) {
      toast(e.message, 'error');
    }
    setInviting(false);
  };

  const removeAccess = async (accessId) => {
    if (!confirm('Zugriff entfernen?')) return;
    await supabase.from('np_project_access').delete().eq('id', accessId);
    toast('Zugriff entfernt');
    loadData();
  };

  const handleArchive = async () => {
    if (!confirm('Projekt wirklich archivieren?')) return;
    await supabase.from('np_projects').update({ active: false }).eq('id', id);
    toast('Projekt archiviert');
    navigate('/projects');
  };

  const handleDelete = async () => {
    if (!confirm('Projekt und alle Daten unwiderruflich löschen?')) return;
    if (!confirm('Sind Sie sicher? Dies kann nicht rückgängig gemacht werden.')) return;
    await supabase.from('np_projects').delete().eq('id', id);
    toast('Projekt gelöscht');
    navigate('/projects');
  };

  if (loading) return <div className="loading"><div className="spinner" />Laden...</div>;
  if (!project) return <div className="content"><div className="empty-state"><h3>Projekt nicht gefunden</h3></div></div>;

  return (
    <>
      <div className="detail-header">
        <div className="detail-breadcrumb">
          <a onClick={() => navigate('/projects')}>Projekte</a>
          <span>/</span>
          <a onClick={() => navigate(`/projects/${id}`)}>{project.name}</a>
          <span>/</span>
          <span>Einstellungen</span>
        </div>
        <div className="detail-title">Projekteinstellungen</div>
      </div>

      <div className="content">
        <div className="section-card" style={{ maxWidth: 600 }}>
          <h3>Allgemein</h3>
          <div className="form-group">
            <label className="form-label">Projektname</label>
            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea className="form-input" value={form.description} onChange={e => update('description', e.target.value)} rows={3} />
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
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
        </div>

        <div className="section-card" style={{ maxWidth: 600 }}>
          <h3>Benutzer-Zugriff</h3>
          {access.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Noch keine Benutzer hinzugefügt</p>}
          {access.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, flex: 1 }}>
                {a.profiles?.first_name} {a.profiles?.last_name} <span style={{ color: 'var(--text-muted)' }}>({a.profiles?.email})</span>
              </span>
              <span className="status-pill" style={{ fontSize: 10, background: 'var(--bg-dark)' }}>{a.role}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => removeAccess(a.id)} style={{ color: 'var(--danger)' }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input className="form-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@beispiel.ch" style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={handleInvite} disabled={inviting}>{inviting ? 'Einladen...' : 'Einladen'}</button>
          </div>
        </div>

        <div className="section-card" style={{ maxWidth: 600 }}>
          <h3>Gefahrenzone</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={handleArchive}>Projekt archivieren</button>
            <button className="btn btn-danger" onClick={handleDelete}>Projekt löschen</button>
          </div>
        </div>
      </div>
    </>
  );
}
