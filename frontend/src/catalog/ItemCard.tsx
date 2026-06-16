import { CatalogItem } from '../types';
import { Lightbox } from '../components/Lightbox';
import { useState } from 'react';

interface Props {
  item: CatalogItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function ItemCard({ item, isSelected, onToggleSelect }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const primary = item.images[0];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open lightbox if clicking the checkbox
    const target = e.target as HTMLElement;
    if (target.closest('.select-check')) return;
    if (primary) setLightboxOpen(true);
  };

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(item.id);
  };

  return (
    <>
      <article
        className={`item-card animate-fade-up ${isSelected ? 'selected' : ''}`}
        onClick={handleCardClick}
        aria-label={`Ítem ${item.itemNumber}`}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' && primary) setLightboxOpen(true); }}
      >
        {/* Thumbnail */}
        <div className="item-card-thumb">
          {primary ? (
            <img
              src={primary.dataUrl}
              alt={`Ítem ${item.itemNumber}`}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cream-muted)',
                fontSize: '0.78rem',
              }}
            >
              Sin foto
            </div>
          )}

          {/* Multi-photo badge */}
          {item.images.length > 1 && (
            <span className="multi-badge">
              1 de {item.images.length} fotos
            </span>
          )}

          {/* Selection checkbox */}
          <div
            className="select-check"
            onClick={handleCheckClick}
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`Seleccionar ítem ${item.itemNumber}`}
            tabIndex={0}
            onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggleSelect(item.id); } }}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Body */}
        <div className="item-card-body">
          <div className="item-card-number">#{item.itemNumber}</div>

          <div className="item-card-footer">
            <span className={`badge ${item.category === 'porcelanas' ? 'badge-por' : 'badge-cris'}`}>
              {item.category === 'porcelanas' ? 'Porcelana' : 'Cristalería'}
            </span>
          </div>

          {item.notes && (
            <p className="item-card-notes">{item.notes}</p>
          )}
        </div>
      </article>

      {lightboxOpen && (
        <Lightbox
          item={item}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
