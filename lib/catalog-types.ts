// Shared, client-safe types for the public catalog. Never put HPP/cost data here:
// everything in CatalogProduct is visible to anonymous visitors.
export type StockStatus = 'available' | 'limited' | 'soldout';

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  stockStatus: StockStatus;
};

export type StoreConfig = {
  name: string;
  tagline: string;
  /** Normalized international format without "+", e.g. 6281234567890. Empty if not set. */
  whatsappNumber: string;
};

export const STOCK_STATUSES: StockStatus[] = ['available', 'limited', 'soldout'];

export const UNCATEGORIZED = 'Lainnya';

export const stockLabels: Record<StockStatus, string> = {
  available: 'Tersedia',
  limited: 'Stok terbatas',
  soldout: 'Habis',
};
