'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { CatalogProduct } from '@/lib/catalog-types';

export const MAX_QTY = 99;
const STORAGE_KEY = 'saucybites_cart_v1';

/** Only ids + quantities are persisted; names/prices always come from the live catalog. */
type CartLine = { id: string; qty: number };

export type CartItem = CatalogProduct & {
  qty: number;
  subtotal: number;
  /** True when the product is sold out or no longer published. */
  unavailable: boolean;
};

type State = { lines: CartLine[]; hydrated: boolean };

type Action =
  | { type: 'hydrate'; lines: CartLine[] }
  | { type: 'add'; id: string; qty: number }
  | { type: 'set'; id: string; qty: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

const clamp = (n: number) => Math.max(0, Math.min(MAX_QTY, Math.floor(n) || 0));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { lines: action.lines, hydrated: true };
    case 'add': {
      const found = state.lines.find((l) => l.id === action.id);
      const lines = found
        ? state.lines.map((l) =>
            l.id === action.id ? { ...l, qty: clamp(l.qty + action.qty) } : l,
          )
        : [...state.lines, { id: action.id, qty: clamp(action.qty) }];
      return { ...state, lines: lines.filter((l) => l.qty > 0) };
    }
    case 'set': {
      const qty = clamp(action.qty);
      const exists = state.lines.some((l) => l.id === action.id);
      const lines = exists
        ? state.lines.map((l) => (l.id === action.id ? { ...l, qty } : l))
        : [...state.lines, { id: action.id, qty }];
      return { ...state, lines: lines.filter((l) => l.qty > 0) };
    }
    case 'remove':
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
    case 'clear':
      return { ...state, lines: [] };
  }
}

function readStorage(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.id === 'string' && Number.isFinite(l.qty))
      .map((l) => ({ id: l.id, qty: clamp(l.qty) }))
      .filter((l) => l.qty > 0);
  } catch {
    return [];
  }
}

type CartContextValue = {
  items: CartItem[];
  /** Total portions of available items. */
  count: number;
  /** Total price of available items. */
  total: number;
  hasUnavailable: boolean;
  hydrated: boolean;
  getQty: (id: string) => number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  products,
  children,
}: {
  products: CatalogProduct[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false });

  // Load once on the client (avoids SSR hydration mismatch), and keep tabs in sync.
  useEffect(() => {
    dispatch({ type: 'hydrate', lines: readStorage() });
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) dispatch({ type: 'hydrate', lines: readStorage() });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Storage full or disabled (private mode): the cart still works in memory.
    }
  }, [state.lines, state.hydrated]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const items = useMemo<CartItem[]>(
    () =>
      state.lines.flatMap((line) => {
        const product = byId.get(line.id);
        if (!product) return []; // Menu deleted or hidden: silently dropped.
        return [
          {
            ...product,
            qty: line.qty,
            subtotal: product.price * line.qty,
            unavailable: product.stockStatus === 'soldout',
          },
        ];
      }),
    [state.lines, byId],
  );

  const available = items.filter((i) => !i.unavailable);
  const count = available.reduce((s, i) => s + i.qty, 0);
  const total = available.reduce((s, i) => s + i.subtotal, 0);

  const getQty = useCallback(
    (id: string) => state.lines.find((l) => l.id === id)?.qty ?? 0,
    [state.lines],
  );
  const add = useCallback(
    (id: string, qty = 1) => dispatch({ type: 'add', id, qty }),
    [],
  );
  const setQty = useCallback(
    (id: string, qty: number) => dispatch({ type: 'set', id, qty }),
    [],
  );
  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value: CartContextValue = {
    items,
    count,
    total,
    hasUnavailable: items.some((i) => i.unavailable),
    hydrated: state.hydrated,
    getQty,
    add,
    setQty,
    remove,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart harus dipakai di dalam <CartProvider>.');
  return ctx;
}
