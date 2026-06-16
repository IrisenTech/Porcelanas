import { useState, useEffect, useRef } from 'react';
import { CatalogItem } from '../types';
import { generateOrderPDF, downloadPDF } from '../lib/pdf';

interface Props {
  itemCount: number;
  selectedItems: CatalogItem[];
  onClose: () => void;
  onDone: () => void;
}

const SHARE_MESSAGE = 'Hola, este es mi pedido de Porcelanas 🏺';

export function ShareModal({ itemCount, selectedItems, onClose, onDone }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const fileRef = useRef<File | null>(null);
  const filename = `pedido-porcelanas-${Date.now()}.pdf`;

  // Whether the device can share an actual file (mobile browsers, mostly).
  const canShareFile = (() => {
    if (!fileRef.current || typeof navigator === 'undefined' || !navigator.canShare) return false;
    try {
      return navigator.canShare({ files: [fileRef.current] });
    } catch {
      return false;
    }
  })();

  // Generate the PDF once when the modal opens.
  useEffect(() => {
    let url = '';
    (async () => {
      try {
        const b = await generateOrderPDF({ recipientEmail: '', selectedItems });
        fileRef.current = new File([b], filename, { type: 'application/pdf' });
        url = URL.createObjectURL(b);
        setBlob(b);
        setPreviewUrl(url);
      } catch {
        setError('No se pudo generar el PDF. Intentá de nuevo.');
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    if (!fileRef.current) return;
    setSharing(true);
    try {
      await navigator.share({
        files: [fileRef.current],
        title: 'Pedido Porcelanas',
        text: SHARE_MESSAGE,
      });
      onDone();
    } catch (err) {
      // AbortError = user dismissed the share sheet; not a real error.
      if ((err as Error)?.name !== 'AbortError') {
        setError('No se pudo compartir. Probá descargando el PDF.');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (!blob) return;
    downloadPDF(blob, filename);
    onDone();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="modal-box animate-scale-in">
        <h2 id="share-modal-title">Tu Pedido</h2>

        {!blob && !error && (
          <div className="flex gap-3" style={{ alignItems: 'center', padding: '2rem 0', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            <span style={{ color: 'var(--cream-dim)' }}>Generando PDF…</span>
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '1rem 0' }}>
            {error}
          </p>
        )}

        {blob && (
          <>
            <p>
              PDF listo con{' '}
              <strong style={{ color: 'var(--cream)' }}>
                {itemCount} ítem{itemCount !== 1 ? 's' : ''}
              </strong>
              . Compartilo por WhatsApp, email o cualquier app.
            </p>

            {previewUrl && (
              <iframe
                title="Vista previa del pedido"
                src={previewUrl}
                style={{
                  width: '100%',
                  height: 280,
                  border: '1px solid var(--border-gold)',
                  borderRadius: 'var(--radius-sm)',
                  margin: '1rem 0',
                  background: '#fff',
                }}
              />
            )}

            <div className="flex gap-3" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={sharing}>
                Cerrar
              </button>

              <button type="button" className="btn btn-ghost" onClick={handleDownload} disabled={sharing}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 16, height: 16, stroke: 'currentColor' }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Descargar PDF
              </button>

              {canShareFile && (
                <button type="button" className="btn btn-gold" onClick={handleShare} disabled={sharing} id="share-pdf-btn">
                  {sharing ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      Compartiendo…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 16, height: 16, stroke: 'currentColor' }}>
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Compartir
                    </>
                  )}
                </button>
              )}
            </div>

            {!canShareFile && (
              <p style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', marginTop: '0.9rem', textAlign: 'right' }}>
                💡 Para enviar por WhatsApp directamente, abrí el catálogo desde tu teléfono.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
