import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HUB_URL } from '../lib/constants';

export default function Login() {
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!input || !password) { setError('Bitte Benutzername/E-Mail und Passwort eingeben'); return; }
    setError('');
    setLoading(true);
    try {
      await login(input, password);
      navigate('/');
    } catch (e) {
      setError(e.message === 'Invalid login credentials' ? 'Ungültige Anmeldedaten' : (e.message || 'Anmeldung fehlgeschlagen'));
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img className="logo-light" src="/logo.webp" alt="NowScale" />
          <img className="logo-dark" src="/logo.webp" alt="NowScale" style={{ display: 'none' }} />
          <span>Projects</span>
        </div>
        <div className="login-title">Anmelden</div>
        <div className="login-subtitle">Melden Sie sich mit Ihrem NowScale-Konto an</div>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">E-Mail oder Benutzername</label>
          <input className="form-input" type="text" placeholder="email@beispiel.ch oder benutzername"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} />
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Passwort</label>
          <input className="form-input" type="password" placeholder="Passwort"
            value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 10 }}
          onClick={handleLogin} disabled={loading}>
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <a href={HUB_URL} style={{ color: 'var(--primary)', textDecoration: 'none' }}>Zurück zum Hub</a>
        </div>
      </div>
    </div>
  );
}
