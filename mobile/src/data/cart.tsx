import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { categoryConflict } from '../domain/rules';
import type { CartLine, Product } from '../domain/types';

const CART_KEY = 'pkm_cart';

type CartContextValue = {
  lines: CartLine[];
  count: number;
  category: Product['category'] | null;
  conflicts: (product: Product) => boolean;
  add: (product: Product, quantity: number) => void;
  replace: (product: Product, quantity: number) => void;
  setQuantity: (uuid: string, quantity: number) => void;
  remove: (uuid: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartLine[] {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readCart());

  const persist = (next: CartLine[]) => {
    setLines(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const value = useMemo<CartContextValue>(() => {
    const category = lines[0]?.product.category ?? null;

    const upsert = (source: CartLine[], product: Product, quantity: number): CartLine[] => {
      const existing = source.find((line) => line.product.uuid === product.uuid);
      if (existing) {
        return source.map((line) => (
          line.product.uuid === product.uuid
            ? { ...line, quantity: line.quantity + quantity }
            : line
        ));
      }

      return [...source, { product, quantity }];
    };

    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      category,
      conflicts(product) {
        return categoryConflict(category, product.category);
      },
      add(product, quantity) {
        if (categoryConflict(category, product.category)) {
          return;
        }

        persist(upsert(lines, product, quantity));
      },
      replace(product, quantity) {
        persist([{ product, quantity }]);
      },
      setQuantity(uuid, quantity) {
        persist(lines.map((line) => (
          line.product.uuid === uuid ? { ...line, quantity } : line
        )));
      },
      remove(uuid) {
        persist(lines.filter((line) => line.product.uuid !== uuid));
      },
      clear() {
        persist([]);
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart harus dipakai di dalam CartProvider.');
  }

  return value;
}
