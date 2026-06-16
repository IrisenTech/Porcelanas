import { useState } from 'react';
import { tryLogin } from '../lib/auth';

interface Props {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    const ok = await tryLogin(username, password);

    if (ok) {
      onSuccess();
    } else {
      setLoading(false);
      setError('Usuario o contraseña incorrectos.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="login-overlay">
      {/* Background decorative elements */}
      <div className="login-bg-orb login-orb-1" />
      <div className="login-bg-orb login-orb-2" />

      <div className={`login-card ${shake ? 'shake' : ''}`}>
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-emblem">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/>
              <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/>
              <path
                d="M24 8 C14 8 8 16 8 24 C8 32 14 40 24 40 C34 40 40 32 40 24 C40 16 34 8 24 8Z"
                stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2"
              />
              <path
                d="M16 24 Q20 18 24 22 Q28 26 32 24"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"
              />
              <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
          <h1 className="login-title">Porcelanas</h1>
          <p className="login-subtitle">Colección Exclusiva</p>
        </div>

        <div className="login-divider" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label className="field-label" htmlFor="login-user">
              Usuario
            </label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                id="login-user"
                className="input login-input"
                type="text"
                placeholder="admin"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="field-label" htmlFor="login-pass">
              Contraseña
            </label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" strokeLinecap="round"/>
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
              </svg>
              <input
                id="login-pass"
                className="input login-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-toggle-pass"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20C7 20 2.73 16.39 1 12a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.11 11 8a18.5 18.5 0 01-2.16 3.19" strokeLinecap="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="login-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 14, height: 14, stroke: 'currentColor', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
              </svg>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-gold w-full login-btn"
            disabled={loading || !username || !password}
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Verificando…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 16, height: 16, stroke: 'currentColor' }}>
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ingresar
              </>
            )}
          </button>
        </form>

        <p className="login-footer">
          Acceso privado · Porcelanas &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
