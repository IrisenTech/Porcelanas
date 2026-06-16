import { useState, useRef } from 'react';

interface Props {
  itemCount: number;
  onConfirm: (email: string) => Promise<void>;
  onClose: () => void;
}

export function EmailModal({ itemCount, onConfirm, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Por favor ingresá un correo válido.');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onConfirm(trimmed);
    } catch {
      setError('Error al generar el PDF. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <div className="modal-box animate-scale-in">
        <h2 id="email-modal-title">Generar Pedido</h2>
        <p>
          Se generará un PDF con <strong style={{ color: 'var(--cream)' }}>{itemCount} ítem{itemCount !== 1 ? 's' : ''}</strong>.
          Ingresá tu correo para recibirlo.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="field-label" htmlFor="recipient-email">
              Correo electrónico
            </label>
            <input
              ref={inputRef}
              id="recipient-email"
              className="input"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              autoFocus
              autoComplete="email"
              disabled={loading}
            />
            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 6 }}>
                {error}
              </p>
            )}
          </div>

          <div
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: 'var(--cream-dim)',
              marginBottom: '1.5rem',
            }}
          >
            💡 El PDF se descargará en tu dispositivo. El envío por email requiere configurar el servidor.
          </div>

          <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-gold"
              id="confirm-pdf-btn"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Generando…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 16, height: 16, stroke: 'currentColor' }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
