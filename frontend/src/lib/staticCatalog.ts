/**
 * staticCatalog.ts
 *
 * Replaces the OPFS-based storage with a static-file approach:
 * - Images live in /public/catalog-images/ as item_001.webp, item_002.webp…
 * - Catalog config lives in localStorage (and can be exported to public/catalog.json)
 * - This approach is Git-friendly and works identically locally and on the VPS
 */

import type { CatalogItem, CatalogStore, Category } from '../types';

const CATALOG_KEY = 'porcelanas_catalog_v2';
const CATALOG_VERSION = 2;

// ── Scan available images from the mapping file ────────────────────────────

export interface StaticImage {
  index: number;       // 1-based
  webpName: string;    // item_001.webp
  path: string;        // /catalog-images/item_001.webp
  originalName: string;
}

let _imageCache: StaticImage[] | null = null;

export async function loadStaticImages(): Promise<StaticImage[]> {
  if (_imageCache) return _imageCache;
  try {
    const res = await fetch('/catalog-images/_mapping.json');
    if (!res.ok) throw new Error('No mapping found');
    const data: StaticImage[] = await res.json();
    _imageCache = data;
    return data;
  } catch {
    // Fallback: generate a list by probing item_001..item_200
    // (for when mapping.json isn't present)
    return [];
  }
}

// ── LocalStorage catalog ───────────────────────────────────────────────────

export function loadCatalog(): CatalogStore {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (raw) return JSON.parse(raw) as CatalogStore;
  } catch {}
  return { version: CATALOG_VERSION, items: [] };
}

export function saveCatalog(store: CatalogStore): void {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(store));
}

// ── Export catalog.json (to be committed to public/) ─────────────────────

export function exportCatalogJSON(): void {
  const store = loadCatalog();
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'catalog.json';
  a.click();
  URL.revokeObjectURL(url);
  alert(
    '📁 catalog.json descargado.\n\n' +
    'Copiá este archivo a:\n  frontend/public/catalog.json\n\n' +
    'Luego hacé git commit y push para publicar en el VPS.'
  );
}

export async function importCatalogJSON(file: File): Promise<CatalogStore> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const store = JSON.parse(reader.result as string) as CatalogStore;
        saveCatalog(store);
        resolve(store);
      } catch {
        reject(new Error('Archivo inválido'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ── Load catalog from public/catalog.json (for production) ────────────────

export async function loadCatalogFromPublic(): Promise<CatalogStore | null> {
  try {
    const res = await fetch('/catalog.json');
    if (!res.ok) return null;
    return await res.json() as CatalogStore;
  } catch {
    return null;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function nextItemNumber(items: CatalogItem[]): string {
  const nums = items.map(i => parseInt(i.itemNumber, 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1).padStart(3, '0');
}

// ── Build a CatalogItem from a static image path ─────────────────────────

export function makeItemFromStaticImage(
  img: StaticImage,
  category: Category = 'porcelanas'
): CatalogItem {
  return {
    id: generateId(),
    itemNumber: String(img.index).padStart(3, '0'),
    category,
    notes: '',
    images: [{ id: img.webpName, opfsName: img.webpName, dataUrl: img.path }],
    createdAt: Date.now(),
  };
}
