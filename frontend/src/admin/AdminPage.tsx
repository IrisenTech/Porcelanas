import { useState, useEffect, useRef } from 'react';
import type { CatalogItem, CatalogImage, Category } from '../types';
import {
  loadStaticImages,
  loadCatalog,
  saveCatalog,
  exportCatalogJSON,
  importCatalogJSON,
  generateId,
  nextItemNumber,
  type StaticImage,
} from '../lib/staticCatalog';

export function AdminPage() {
  const [staticImages, setStaticImages] = useState<StaticImage[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [draggedImgPath, setDraggedImgPath] = useState<string | null>(null);
  const [activeDropSlot, setActiveDropSlot] = useState<string | null>(null);
  // Set of item IDs that are currently expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const importRef = useRef<HTMLInputElement>(null);

  const assignedPaths = new Set(items.flatMap(i => i.images.map(img => img.dataUrl)));
  const unassigned = staticImages.filter(img => !assignedPaths.has(img.path));

  useEffect(() => {
    const init = async () => {
      const [imgs, store] = await Promise.all([
        loadStaticImages(),
        Promise.resolve(loadCatalog()),
      ]);
      setStaticImages(imgs);
      setItems(store.items);
      setLoading(false);
    };
    init();
  }, []);

  // ── Expand / Collapse helpers ─────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(items.map(i => i.id)));
  const collapseAll = () => setExpandedIds(new Set());

  // ── Slot management ───────────────────────────────────────────────────────

  const addSlot = () => {
    const newItem: CatalogItem = {
      id: generateId(),
      itemNumber: nextItemNumber(items),
      category: 'porcelanas',
      notes: '',
      images: [],
      createdAt: Date.now(),
    };
    const updated = [...items, newItem];
    updateItems(updated);
    // New items start expanded
    setExpandedIds(prev => new Set([...prev, newItem.id]));
  };

  const removeSlot = (itemId: string) => {
    updateItems(items.filter(i => i.id !== itemId));
    setExpandedIds(prev => { const s = new Set(prev); s.delete(itemId); return s; });
  };

  const updateSlotField = (itemId: string, field: keyof CatalogItem, value: string) => {
    updateItems(items.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const removeImageFromSlot = (itemId: string, imgId: string) => {
    updateItems(items.map(i =>
      i.id === itemId ? { ...i, images: i.images.filter(img => img.id !== imgId) } : i
    ));
  };

  // Rotate an assigned image by +90° (cycles 0 → 90 → 180 → 270 → 0).
  const rotateImage = (itemId: string, imgId: string) => {
    updateItems(items.map(i =>
      i.id === itemId
        ? {
            ...i,
            images: i.images.map(img =>
              img.id === imgId
                ? { ...img, rotation: (((img.rotation ?? 0) + 90) % 360) }
                : img
            ),
          }
        : i
    ));
  };

  const updateItems = (updated: CatalogItem[]) => {
    setItems(updated);
    const store = loadCatalog();
    store.items = updated;
    saveCatalog(store);
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  const handleSlotDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setActiveDropSlot(null);
    if (!draggedImgPath) return;

    // Only drop into expanded slots
    if (!expandedIds.has(slotId)) return;

    const staticImg = staticImages.find(img => img.path === draggedImgPath);
    if (!staticImg) return;

    const newImage: CatalogImage = {
      id: staticImg.webpName,
      opfsName: staticImg.webpName,
      dataUrl: staticImg.path,
    };

    updateItems(items.map(item =>
      item.id === slotId
        ? { ...item, images: [...item.images, newImage] }
        : item
    ));
    setDraggedImgPath(null);
  };

  // ── Auto-create all unassigned as individual items ────────────────────────

  const autoCreateAll = () => {
    if (unassigned.length === 0) return;
    const newItems: CatalogItem[] = unassigned.map((img, i) => ({
      id: generateId(),
      itemNumber: String(items.length + i + 1).padStart(3, '0'),
      category: 'porcelanas' as Category,
      notes: '',
      images: [{ id: img.webpName, opfsName: img.webpName, dataUrl: img.path }],
      createdAt: Date.now(),
    }));
    updateItems([...items, ...newItems]);
    // Start all new items collapsed
  };

  const handlePublish = () => {
    const store = loadCatalog();
    store.items = items;
    saveCatalog(store);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const store = await importCatalogJSON(file);
      setItems(store.items);
    } catch {
      alert('Archivo de catálogo inválido.');
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p className="text-muted">Cargando imágenes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>
            Panel de Administración
          </h1>
          <p className="text-muted" style={{ marginTop: 6 }}>
            {staticImages.length} fotos disponibles · {items.length} ítems en el catálogo ·{' '}
            {unassigned.length} sin asignar
          </p>
        </div>

        <div className="divider" />

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>
              ↑ Importar catálogo
            </button>
            <button className="btn btn-ghost btn-sm" onClick={exportCatalogJSON}>
              ↓ Exportar catálogo
            </button>
            {unassigned.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={autoCreateAll}
                title="Crea un ítem por cada foto no asignada"
              >
                ⚡ Crear ítems auto ({unassigned.length})
              </button>
            )}
          </div>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn btn-gold" onClick={handlePublish} id="publish-catalog-btn">
            {saved ? '✓ Guardado' : '🚀 Publicar Catálogo'}
          </button>
        </div>

        {staticImages.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            <h3>Sin imágenes convertidas</h3>
            <p>Ejecutá <code>node scripts/convert-images.mjs</code> para convertir tus fotos a WebP.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>

            {/* ── Left: Unassigned photos ─────────────────────────────── */}
            <div style={{ position: 'sticky', top: 76, maxHeight: 'calc(100dvh - 100px)', overflowY: 'auto', paddingBottom: 16 }}>
              <p className="text-sm text-muted" style={{ marginBottom: 10 }}>
                📷 <strong style={{ color: 'var(--cream)' }}>Fotos sin asignar</strong> ({unassigned.length})
                <br />
                <em style={{ fontSize: '0.72rem' }}>Expandí un ítem primero, luego arrastrá →</em>
              </p>
              <div className="unassigned-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))' }}>
                {unassigned.map(img => (
                  <div
                    key={img.webpName}
                    className={`unassigned-thumb ${draggedImgPath === img.path ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => setDraggedImgPath(img.path)}
                    onDragEnd={() => setDraggedImgPath(null)}
                    title={img.webpName}
                  >
                    <img src={img.path} alt={img.webpName} loading="lazy" />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.65)', fontSize: '0.58rem',
                      color: 'var(--cream-dim)', padding: '2px 4px', textAlign: 'center',
                    }}>
                      {img.webpName.replace('.webp', '')}
                    </div>
                  </div>
                ))}
                {unassigned.length === 0 && (
                  <p style={{ color: 'var(--cream-muted)', fontSize: '0.8rem', gridColumn: '1/-1' }}>
                    ✓ Todas las fotos asignadas
                  </p>
                )}
              </div>
            </div>

            {/* ── Right: Item slots (accordion) ──────────────────────── */}
            <div>
              {/* Expand / Collapse All controls */}
              {items.length > 0 && (
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <p className="text-sm text-muted">
                    🏺 <strong style={{ color: 'var(--cream)' }}>Ítems del catálogo</strong> ({items.length})
                    {' · '}{expandedIds.size} expandido(s)
                  </p>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={expandAll} id="expand-all-btn">
                      ↕ Expandir todo
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={collapseAll} id="collapse-all-btn">
                      ↕ Colapsar todo
                    </button>
                  </div>
                </div>
              )}

              <div className="item-slots">
                {items.map(item => {
                  const isExpanded = expandedIds.has(item.id);
                  const primaryImg = item.images[0];

                  return (
                    <div
                      key={item.id}
                      className={`item-slot ${activeDropSlot === item.id ? 'drop-active' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
                      style={{ padding: 0, overflow: 'hidden' }}
                      onDragOver={e => {
                        if (!isExpanded) return; // must be expanded to receive drops
                        e.preventDefault();
                        setActiveDropSlot(item.id);
                      }}
                      onDragLeave={() => setActiveDropSlot(null)}
                      onDrop={e => handleSlotDrop(e, item.id)}
                    >
                      {/* ── Accordion Header (always visible) ── */}
                      <div
                        className="slot-accordion-header"
                        onClick={() => toggleExpand(item.id)}
                        role="button"
                        aria-expanded={isExpanded}
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(item.id); }}
                      >
                        {/* Primary thumbnail preview (collapsed only) */}
                        <div className="slot-preview-thumb">
                          {primaryImg ? (
                            <img src={primaryImg.dataUrl} alt="" data-rot={primaryImg.rotation ?? 0} />
                          ) : (
                            <div className="slot-preview-empty">
                              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ width: 16, height: 16, stroke: 'var(--cream-muted)' }}>
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Item info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-2">
                            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--cream)', fontWeight: 600 }}>
                              #{item.itemNumber}
                            </span>
                            <span className={`badge ${item.category === 'porcelanas' ? 'badge-por' : 'badge-cris'}`}>
                              {item.category === 'porcelanas' ? 'Porcelana' : 'Cristalería'}
                            </span>
                            <span className="text-xs text-muted">
                              {item.images.length} foto{item.images.length !== 1 ? 's' : ''}
                            </span>
                            {item.notes && (
                              <span className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                · {item.notes}
                              </span>
                            )}
                          </div>
                          {!isExpanded && item.images.length === 0 && (
                            <span className="text-xs" style={{ color: 'var(--gold)', fontSize: '0.68rem' }}>
                              ⚠ Sin fotos — expandí para asignar
                            </span>
                          )}
                        </div>

                        {/* Chevron + Delete */}
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => removeSlot(item.id)}
                            title="Eliminar ítem"
                          >
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 13, height: 13, stroke: 'currentColor' }}>
                              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <div
                            style={{
                              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--gold)', transition: 'transform 220ms ease',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              cursor: 'pointer',
                            }}
                            onClick={() => toggleExpand(item.id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 16, height: 16, stroke: 'currentColor' }}>
                              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* ── Accordion Body (only when expanded) ── */}
                      {isExpanded && (
                        <div className="slot-accordion-body">
                          {/* Fields row */}
                          <div className="item-slot-header" style={{ marginBottom: 12 }}>
                            <div style={{ flex: '0 0 70px' }}>
                              <label className="field-label">Nº</label>
                              <input
                                className="input"
                                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                value={item.itemNumber}
                                onChange={e => updateSlotField(item.id, 'itemNumber', e.target.value)}
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label className="field-label">Categoría</label>
                              <select
                                className="select"
                                style={{ padding: '6px 30px 6px 10px', fontSize: '0.8rem', width: '100%' }}
                                value={item.category}
                                onChange={e => updateSlotField(item.id, 'category', e.target.value)}
                                onClick={e => e.stopPropagation()}
                              >
                                <option value="porcelanas">Porcelanas</option>
                                <option value="cristaleria">Cristalería</option>
                              </select>
                            </div>
                            <div style={{ flex: 2 }}>
                              <label className="field-label">Notas</label>
                              <input
                                className="input"
                                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                placeholder="Descripción, medidas…"
                                value={item.notes}
                                onChange={e => updateSlotField(item.id, 'notes', e.target.value)}
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          {/* Drop zone */}
                          <div className="item-slot-images">
                            {item.images.length === 0 ? (
                              <span className="drop-hint">
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ width: 16, height: 16, stroke: 'var(--cream-muted)' }}>
                                  <path d="M12 4v16M4 12h16" strokeLinecap="round"/>
                                </svg>
                                Arrastrá fotos aquí desde la columna izquierda
                              </span>
                            ) : (
                              item.images.map((img, imgIdx) => (
                                <div key={img.id} className={`slot-thumb ${imgIdx === 0 ? 'slot-thumb-primary' : ''}`}>
                                  <img src={img.dataUrl} alt="" data-rot={img.rotation ?? 0} />
                                  <button
                                    type="button"
                                    className="rotate-img"
                                    onClick={e => { e.stopPropagation(); rotateImage(item.id, img.id); }}
                                    title="Rotar 90°"
                                    aria-label="Rotar imagen"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                                      <path d="M21 2v6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                  <div
                                    className="remove-img"
                                    onClick={() => removeImageFromSlot(item.id, img.id)}
                                    role="button"
                                    aria-label="Quitar foto"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                                    </svg>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <p className="text-xs text-muted mt-1">
                            {item.images.length > 0
                              ? `${item.images.length} foto(s) — Primera = principal`
                              : 'Sin fotos aún'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button className="add-slot-btn" onClick={addSlot}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 16, height: 16, stroke: 'currentColor' }}>
                    <path d="M12 4v16M4 12h16" strokeLinecap="round"/>
                  </svg>
                  Agregar ítem
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Bottom publish bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <p className="text-sm text-muted">
            {items.length} ítem(s) · {unassigned.length} foto(s) sin asignar
          </p>
          <button className="btn btn-gold" onClick={handlePublish} id="publish-catalog-btn-bottom">
            {saved ? '✓ Guardado' : '🚀 Publicar Catálogo'}
          </button>
        </div>

      </div>
    </div>
  );
}
