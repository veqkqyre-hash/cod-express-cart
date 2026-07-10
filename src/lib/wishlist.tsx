import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  count: number;
};

const WishlistCtx = createContext<Ctx | null>(null);
const KEY = "pink_wishlist_v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])), []);
  const clear = useCallback(() => setIds([]), []);

  return <WishlistCtx.Provider value={{ ids, has, toggle, clear, count: ids.length }}>{children}</WishlistCtx.Provider>;
}

export function useWishlist() {
  const c = useContext(WishlistCtx);
  if (!c) throw new Error("useWishlist must be inside WishlistProvider");
  return c;
}
