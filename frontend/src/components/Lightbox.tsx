import { useEffect, useRef, useCallback } from 'react';
import { CatalogItem } from '../types';

interface Props {
  item: CatalogItem;
  initialIndex?: number;
  onClose: () => void;
}

export function Lightbox({ item, initialIndex = 0, onClose }: Props) {
  const indexRef = useRef(initialIndex);
  const imgRef = useRef<HTMLImageElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  // Sync dots and image without re-render
  const syncUI = useCallback((idx: number) => {
    if (imgRef.current) {
      imgRef.current.src = item.images[idx]?.dataUrl ?? '';
    }
    if (dotsRef.current) {
      dotsRef.current.querySelectorAll('.lightbox-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
      });
    }
    const counter = document.getElementById('lb-counter');
    if (counter) counter.textContent = `${idx + 1} / ${item.images.length}`;
  }, [item.images]);

  const navigate = useCallback((dir: 1 | -1) => {
    const total = item.images.length;
    if (total <= 1) return;
    indexRef.current = (indexRef.current + dir + total) % total;
    syncUI(indexRef.current);
  }, [item.images.length, syncUI]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onClose]);

  // Touch swipe
  useEffect(() => {
    let startX = 0;
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigate]);

  const hasMultiple = item.images.length > 1;

  return (
    <div
      className="lightbox-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Ítem ${item.itemNumber}`}
    >
      <button className="lightbox-close" onClick={onClose} aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
        </svg>
      </button>

      <div className="lightbox-inner">
        <div className="lightbox-img-wrap">
          {hasMultiple && (
            <button className="lightbox-nav prev" onClick={() => navigate(-1)} aria-label="Anterior">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          <img
            ref={imgRef}
            src={item.images[initialIndex]?.dataUrl ?? ''}
            alt={`Ítem ${item.itemNumber}`}
            draggable={false}
          />

          {hasMultiple && (
            <button className="lightbox-nav next" onClick={() => navigate(1)} aria-label="Siguiente">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        <div className="lightbox-info">
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--cream)' }}>
            Ítem <strong style={{ color: 'var(--gold)' }}>#{item.itemNumber}</strong>
          </span>
          <span className={`badge ${item.category === 'porcelanas' ? 'badge-por' : 'badge-cris'}`}>
            {item.category === 'porcelanas' ? 'Porcelana' : 'Cristalería'}
          </span>
          {hasMultiple && (
            <span id="lb-counter" className="lightbox-counter">
              {initialIndex + 1} / {item.images.length}
            </span>
          )}
        </div>

        {hasMultiple && (
          <div className="lightbox-dots" ref={dotsRef}>
            {item.images.map((_, i) => (
              <div
                key={i}
                className={`lightbox-dot ${i === initialIndex ? 'active' : ''}`}
                onClick={() => { indexRef.current = i; syncUI(i); }}
                role="button"
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        )}

        {item.notes && (
          <p className="text-sm" style={{ color: 'var(--cream-dim)', textAlign: 'center', maxWidth: 500 }}>
            {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}
