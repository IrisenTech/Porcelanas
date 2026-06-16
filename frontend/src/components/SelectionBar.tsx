import { CatalogItem } from '../types';

interface Props {
  count: number;
  onGenerate: () => void;
  onClear: () => void;
  items: CatalogItem[];
}

export function SelectionBar({ count, onGenerate, onClear }: Props) {
  if (count === 0) return null;

  return (
    <div className="selection-bar">
      <div className="selection-bar-inner">
        <div className="selection-count">
          <strong>{count}</strong>{' '}
          {count === 1 ? 'ítem seleccionado' : 'ítems seleccionados'}
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={onClear}
          id="clear-selection-btn"
        >
          Limpiar
        </button>

        <button
          className="btn btn-gold"
          onClick={onGenerate}
          id="generate-pdf-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 16, height: 16, stroke: 'currentColor' }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinejoin="round"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Generar PDF
        </button>
      </div>
    </div>
  );
}
