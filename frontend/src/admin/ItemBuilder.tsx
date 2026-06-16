import React, { useState, useRef } from 'react';
import { CatalogItem, CatalogImage, Category, UnassignedPhoto } from '../types';
import {
  loadCatalog, saveCatalog, deleteImageFromOPFS, generateId, nextItemNumber,
  exportCatalogJSON, importCatalogJSON,
} from '../lib/storage';

interface Props {
  unassigned: UnassignedPhoto[];
  onUnassignedChange: (photos: UnassignedPhoto[]) => void;
  items: CatalogItem[];
  onItemsChange: (items: CatalogItem[]) => void;
}

export function ItemBuilder({ unassigned, onUnassignedChange, items, onItemsChange }: Props) {
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [activeDropSlot, setActiveDropSlot] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // ── Slot management ─────────────────────────────────────────────────────

  const addSlot = () => {
    const store = loadCatalog();
    const newItem: CatalogItem = {
      id: generateId(),
      itemNumber: nextItemNumber(items),
      category: 'porcelanas',
      notes: '',
      images: [],
      createdAt: Date.now(),
    };
    const updated = [...items, newItem];
    store.items = updated;
    saveCatalog(store);
    onItemsChange(updated);
  };

  const removeSlot = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    // Remove images from OPFS
    await Promise.all(item.images.map(img => deleteImageFromOPFS(img.opfsName)));
    // Return any loaded dataUrls back to unassigned? No — they're gone.
    const updated = items.filter(i => i.id !== itemId);
    const store = loadCatalog();
    store.items = updated;
    saveCatalog(store);
    onItemsChange(updated);
  };

  const updateSlotField = (itemId: string, field: 'category' | 'notes' | 'itemNumber', value: string) => {
    const updated = items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    const store = loadCatalog();
    store.items = updated;
    saveCatalog(store);
    onItemsChange(updated);
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────

  const handlePhotoDragStart = (id: string) => {
    setDraggedPhotoId(id);
  };

  const handleSlotDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setActiveDropSlot(slotId);
  };

  const handleSlotDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setActiveDropSlot(null);
    if (!draggedPhotoId) return;

    const photo = unassigned.find(p => p.id === draggedPhotoId);
    if (!photo) return;

    // Add image to slot
    const newImage: CatalogImage = {
      id: photo.id,
      opfsName: photo.opfsName,
      dataUrl: photo.dataUrl,
    };

    const updated = items.map(item =>
      item.id === slotId
        ? { ...item, images: [...item.images, newImage] }
        : item
    );
    const store = loadCatalog();
    store.items = updated;
    saveCatalog(store);
    onItemsChange(updated);

    // Remove from unassigned
    onUnassignedChange(unassigned.filter(p => p.id !== draggedPhotoId));
    setDraggedPhotoId(null);
  };

  const removeImageFromSlot = (itemId: string, imgId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const img = item.images.find(i => i.id === imgId);

    const updated = items.map(i =>
      i.id === itemId
        ? { ...i, images: i.images.filter(img => img.id !== imgId) }
        : i
    );
    const store = loadCatalog();
    store.items = updated;
    saveCatalog(store);
    onItemsChange(updated);

    // Return to unassigned if dataUrl available
    if (img?.dataUrl) {
      onUnassignedChange([...unassigned, { id: img.id, opfsName: img.opfsName, dataUrl: img.dataUrl }]);
    }
  };

  const deleteUnassigned = async (id: string) => {
    const photo = unassigned.find(p => p.id === id);
    if (photo) await deleteImageFromOPFS(photo.opfsName);
    onUnassignedChange(unassigned.filter(p => p.id !== id));
  };

  // ── Import/Export ────────────────────────────────────────────────────────

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const store = await importCatalogJSON(file);
      onItemsChange(store.items);
    } catch {
      alert('Archivo de catálogo inválido.');
    }
    e.target.value = '';
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 10 }}>
        <h2 className="admin-section-title" style={{ margin: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ width: 20, height: 20, stroke: 'var(--gold)' }}>
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          Constructor de Ítems
        </h2>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>
            ↑ Importar JSON
          </button>
          <button className="btn btn-ghost btn-sm" onClick={exportCatalogJSON}>
            ↓ Exportar JSON
          </button>
        </div>
        <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left: Unassigned photos */}
        <div>
          <p className="text-sm text-muted mb-2" style={{ marginBottom: 10 }}>
            📷 Fotos sin asignar ({unassigned.length}) — <em>Arrastrá hacia un ítem →</em>
          </p>
          {unassigned.length === 0 ? (
            <div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', padding: '1rem 0' }}>
              Sin fotos pendientes.
            </div>
          ) : (
            <div className="unassigned-grid">
              {unassigned.map(photo => (
                <div
                  key={photo.id}
                  className={`unassigned-thumb ${draggedPhotoId === photo.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handlePhotoDragStart(photo.id)}
                  onDragEnd={() => setDraggedPhotoId(null)}
                >
                  <img src={photo.dataUrl} alt="" loading="lazy" />
                  <button
                    className="thumb-del"
                    onClick={() => deleteUnassigned(photo.id)}
                    title="Eliminar foto"
                    aria-label="Eliminar foto"
                  >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Item slots */}
        <div>
          <p className="text-sm text-muted mb-2" style={{ marginBottom: 10 }}>
            🏺 Ítems del catálogo ({items.length})
          </p>
          <div className="item-slots">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`item-slot ${activeDropSlot === item.id ? 'drop-active' : ''}`}
                onDragOver={e => handleSlotDragOver(e, item.id)}
                onDragLeave={() => setActiveDropSlot(null)}
                onDrop={e => handleSlotDrop(e, item.id)}
              >
                <div className="item-slot-header">
                  {/* Item number */}
                  <div style={{ flex: '0 0 70px' }}>
                    <label className="field-label">Nº</label>
                    <input
                      className="input"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      value={item.itemNumber}
                      onChange={e => updateSlotField(item.id, 'itemNumber', e.target.value)}
                    />
                  </div>

                  {/* Category */}
                  <div style={{ flex: 1 }}>
                    <label className="field-label">Categoría</label>
                    <select
                      className="select"
                      style={{ padding: '6px 30px 6px 10px', fontSize: '0.8rem', width: '100%' }}
                      value={item.category}
                      onChange={e => updateSlotField(item.id, 'category', e.target.value as Category)}
                    >
                      <option value="porcelanas">Porcelanas</option>
                      <option value="cristaleria">Cristalería</option>
                    </select>
                  </div>

                  {/* Delete slot */}
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ alignSelf: 'flex-end', padding: '6px 10px' }}
                    onClick={() => removeSlot(item.id)}
                    title="Eliminar ítem"
                  >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 14, height: 14, stroke: 'currentColor' }}>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 10 }}>
                  <label className="field-label">Notas (opcional)</label>
                  <input
                    className="input"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    placeholder="Descripción, estado, medidas..."
                    value={item.notes}
                    onChange={e => updateSlotField(item.id, 'notes', e.target.value)}
                  />
                </div>

                {/* Image drop zone */}
                <div className="item-slot-images">
                  {item.images.length === 0 ? (
                    <span className="drop-hint">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ width: 16, height: 16, stroke: 'var(--cream-muted)' }}>
                        <path d="M12 4v16M4 12h16" strokeLinecap="round"/>
                      </svg>
                      Arrastrá fotos aquí
                    </span>
                  ) : (
                    item.images.map((img, imgIdx) => (
                      <div key={img.id} className={`slot-thumb ${imgIdx === 0 ? 'slot-thumb-primary' : ''}`}>
                        <img src={img.dataUrl} alt="" />
                        <div className="remove-img" onClick={() => removeImageFromSlot(item.id, img.id)} role="button">
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
                    ? `${item.images.length} foto${item.images.length > 1 ? 's' : ''} — Primera = principal`
                    : 'Sin fotos'}
                </p>
              </div>
            ))}

            <button className="add-slot-btn" onClick={addSlot}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ width: 16, height: 16, stroke: 'currentColor' }}>
                <path d="M12 4v16M4 12h16" strokeLinecap="round"/>
              </svg>
              Agregar ítem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
