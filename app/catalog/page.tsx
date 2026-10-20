import type { Metadata } from 'next';
import { getCatalogProducts, getStoreConfig } from '@/lib/catalog';
import type { CatalogProduct } from '@/lib/catalog-types';
import { CartProvider } from '@/context/CartContext';
import CatalogView from './catalog-view';

// Always read the latest menu, price, image & stock set by the team.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  const store = getStoreConfig();
  return {
    title: `Katalog ${store.name}: Pesan via WhatsApp`,
    description: store.tagline,
  };
}

export default async function CatalogPage() {
  const store = getStoreConfig();
  let products: CatalogProduct[] = [];
  let loadError = false;
  try {
    products = await getCatalogProducts();
  } catch (e) {
    console.error('Gagal memuat katalog', e);
    loadError = true;
  }

  return (
    <CartProvider products={products}>
      <CatalogView products={products} store={store} loadError={loadError} />
    </CartProvider>
  );
}
