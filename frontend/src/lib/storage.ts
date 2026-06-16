import { CatalogStore, CatalogItem, UnassignedPhoto } from '../types';

const CATALOG_KEY = 'porcelanas_catalog';
const UNASSIGNED_KEY = 'porcelanas_unassigned';
const CATALOG_VERSION = 1;

// ─── LocalStorage catalog ──────────────────────────────────────────────────

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

export function exportCatalogJSON(): void {
  const store = loadCatalog();
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'catalog.json';
  a.click();
  URL.revokeObjectURL(url);
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
        reject(new Error('Invalid catalog file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ─── Unassigned photos (also LocalStorage, storing IDs only) ──────────────

export function loadUnassignedIds(): string[] {
  try {
    const raw = localStorage.getItem(UNASSIGNED_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return [];
}

export function saveUnassignedIds(ids: string[]): void {
  localStorage.setItem(UNASSIGNED_KEY, JSON.stringify(ids));
}

// ─── OPFS image storage ────────────────────────────────────────────────────

async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
  return await navigator.storage.getDirectory();
}

export async function saveImageToOPFS(name: string, blob: Blob): Promise<void> {
  const root = await getOPFSRoot();
  const fh = await root.getFileHandle(name, { create: true });
  const writable = await fh.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function loadImageFromOPFS(name: string): Promise<string | null> {
  try {
    const root = await getOPFSRoot();
    const fh = await root.getFileHandle(name);
    const file = await fh.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

export async function deleteImageFromOPFS(name: string): Promise<void> {
  try {
    const root = await getOPFSRoot();
    await root.removeEntry(name);
  } catch {}
}

export async function listOPFSFiles(): Promise<string[]> {
  const root = await getOPFSRoot();
  const names: string[] = [];
  for await (const [name] of (root as any).entries()) {
    names.push(name);
  }
  return names;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function nextItemNumber(items: CatalogItem[]): string {
  const nums = items.map(i => parseInt(i.itemNumber, 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1).padStart(3, '0');
}

// ─── Load all item images into dataUrls (bulk) ────────────────────────────

export async function hydrateItemImages(items: CatalogItem[]): Promise<CatalogItem[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      images: await Promise.all(
        item.images.map(async (img) => ({
          ...img,
          dataUrl: (await loadImageFromOPFS(img.opfsName)) ?? '',
        }))
      ),
    }))
  );
}
