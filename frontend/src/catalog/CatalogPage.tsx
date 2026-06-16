import { useState, useEffect, useCallback } from 'react';
import { ItemCard } from './ItemCard';
import { SelectionBar } from '../components/SelectionBar';
import { EmailModal } from '../components/EmailModal';
import { loadCatalog, loadCatalogFromPublic } from '../lib/staticCatalog';
import { generateOrderPDF, downloadPDF } from '../lib/pdf';
import { CatalogItem } from '../types';

type Filter = 'all' | 'porcelanas' | 'cristaleria';

export function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Load catalog: prefer localStorage, fall back to public/catalog.json
  useEffect(() => {
    const init = async () => {
      let store = loadCatalog();
      // If localStorage is empty, try loading the committed catalog.json
      if (store.items.length === 0) {
        const publicStore = await loadCatalogFromPublic();
        if (publicStore) store = publicStore;
      }
      // Images are static paths (/catalog-images/item_001.webp) — no hydration needed
      setItems(store.items);
      setLoading(false);
    };
    init();
  }, []);

  const filteredItems = items.filter(item =>
    filter === 'all' ? true : item.category === filter
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Set());

  const selectedItems = items.filter(i => selected.has(i.id));

  const handleGeneratePDF = async (recipientEmail: string) => {
    setGeneratingPDF(true);
    try {
      const blob = await generateOrderPDF({
        recipientEmail,
        selectedItems,
      });
      downloadPDF(blob, `pedido-porcelanas-${Date.now()}.pdf`);
      setShowEmailModal(false);
      clearSelection();
    } finally {
      setGeneratingPDF(false);
    }
  };

  const porCount = items.filter(i => i.category === 'porcelanas').length;
  const crisCount = items.filter(i => i.category === 'cristaleria').length;

  return (
    <div className="catalog-page">
      <div className="container">
        {/* Header */}
        <div className="catalog-header animate-fade-up">
          <h1>Colección Exclusiva</h1>
          <p>
            {items.length > 0
              ? `${items.length} piezas disponibles — Seleccioná para generar tu pedido`
              : 'El catálogo está siendo preparado'}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {(
            [
              { key: 'all', label: `Todos (${items.length})` },
              { key: 'porcelanas', label: `Porcelanas (${porCount})` },
              { key: 'cristaleria', label: `Cristalería (${crisCount})` },
            ] as { key: Filter; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              className={`filter-tab ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
              id={`filter-${key}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="catalog-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="item-card">
                <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--radius) var(--radius) 0 0' }} />
                <div className="item-card-body">
                  <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 20, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>
              {items.length === 0
                ? 'Catálogo vacío'
                : 'Sin ítems en esta categoría'}
            </h3>
            <p>
              {items.length === 0
                ? 'El administrador aún no publicó ítems. Visitá el panel de administración.'
                : 'Probá con otro filtro.'}
            </p>
          </div>
        ) : (
          <div className="catalog-grid">
            {filteredItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                isSelected={selected.has(item.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selection bar */}
      <SelectionBar
        count={selected.size}
        items={selectedItems}
        onGenerate={() => setShowEmailModal(true)}
        onClear={clearSelection}
      />

      {/* Email modal */}
      {showEmailModal && (
        <EmailModal
          itemCount={selected.size}
          onConfirm={handleGeneratePDF}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
