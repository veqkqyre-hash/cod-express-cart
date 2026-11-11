import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  /** Varianti i zgjedhur (p.sh. ngjyra), nëse produkti ka variante */
  variantId?: string | null;
  variantName?: string | null;
};

/** Çelësi unik i rreshtit në shportë: produkt + variant */
export const cartKey = (it: { id: string; variantId?: string | null }) => `${it.id}:${it.variantId ?? ""}`;

type Ctx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "bella_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add: Ctx["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const k = cartKey(item);
      const existing = prev.find((p) => cartKey(p) === k);
      if (existing) {
        return prev.map((p) => (cartKey(p) === k ? { ...p, quantity: p.quantity + qty } : p));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };
  const remove = (key: string) => setItems((prev) => prev.filter((p) => cartKey(p) !== key));
  const setQty = (key: string, qty: number) =>
    setItems((prev) => prev.map((p) => (cartKey(p) === key ? { ...p, quantity: Math.max(1, qty) } : p)));
  const clear = () => setItems([]);
  const count = items.reduce((a, b) => a + b.quantity, 0);
  const subtotal = items.reduce((a, b) => a + b.price * b.quantity, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}

export const formatEur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
