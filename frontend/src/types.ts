export type Category = 'porcelanas' | 'cristaleria';

export interface CatalogImage {
  id: string;          // unique image id
  opfsName: string;    // filename in OPFS
  dataUrl?: string;    // ephemeral, loaded at runtime
}

export interface CatalogItem {
  id: string;           // e.g. "por_001"
  itemNumber: string;   // display number e.g. "001"
  category: Category;
  notes: string;
  images: CatalogImage[]; // ordered list; [0] = primary
  createdAt: number;
}

export interface CatalogStore {
  version: number;
  items: CatalogItem[];
}

export interface UnassignedPhoto {
  id: string;
  opfsName: string;
  dataUrl: string;
}
