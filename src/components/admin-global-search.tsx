import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, ShoppingCart, Users, LayoutGrid, X } from "lucide-react";

type Section = { key: string; label: string };

type Props = {
  lang: string;
  sections: Section[];
  canSee: (key: string) => boolean;
  onSelect: (key: string) => void;
};

type Results = {
  products: { id: string; name: string; sku: string | null; barcode: string | null }[];
  orders: { id: string; order_number: string; customer_name: string }[];
  customers: { name: string; email: string | null; phone: string | null }[];
  sections: Section[];
};

export function AdminGlobalSearch({ lang, sections, canSee, onSelect }: Props) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data } = useQuery<Results>({
    queryKey: ["admin-global-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: async () => {
      const like = `%${debounced.replace(/[%_]/g, "")}%`;
      const [products, orders, customers] = await Promise.all([
        canSee("products")
          ? supabase
              .from("products")
              .select("id,name_sq,name_en,sku,barcode")
              .or(`name_sq.ilike.${like},name_en.ilike.${like},sku.ilike.${like},barcode.ilike.${like}`)
              .limit(5)
          : Promise.resolve({ data: [] }),
        canSee("orders")
          ? supabase
              .from("orders")
              .select("id,order_number,customer_name")
              .ilike("order_number", like)
              .limit(5)
          : Promise.resolve({ data: [] }),
        canSee("customers")
          ? supabase
              .from("orders")
              .select("customer_name,email,phone")
              .or(`customer_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
              .limit(5)
          : Promise.resolve({ data: [] }),
      ]);
      const lower = debounced.toLowerCase();
      return {
        products: (products.data ?? []).map((p: any) => ({
          id: p.id,
          name: lang === "sq" ? p.name_sq : p.name_en,
          sku: p.sku,
          barcode: p.barcode,
        })),
        orders: (orders.data ?? []) as Results["orders"],
        customers: ((customers.data ?? []) as any[]).map((c) => ({
          name: c.customer_name,
          email: c.email,
          phone: c.phone,
        })),
        sections: sections.filter((s) => s.label.toLowerCase().includes(lower)).slice(0, 5),
      };
    },
  });

  const hasResults =
    !!data && (data.products.length > 0 || data.orders.length > 0 || data.customers.length > 0 || data.sections.length > 0);

  function go(key: string) {
    onSelect(key);
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={boxRef} className="relative hidden md:block w-72 lg:w-96">
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--pink-deep,#e91e63)]/30">
        <Search className="h-4 w-4 shrink-0 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={L("Kërko: produkt, porosi, klient, seksion…", "Search: product, order, customer, section…")}
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
        {q && (
          <button onClick={() => setQ("")} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl">
          {!hasResults && (
            <div className="px-4 py-6 text-center text-sm text-neutral-500">
              {L("Asnjë rezultat për", "No results for")} “{debounced}”
            </div>
          )}

          {data && data.sections.length > 0 && (
            <div className="border-b border-neutral-100 py-1">
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                {L("Seksionet", "Sections")}
              </div>
              {data.sections.map((s) => (
                <button key={s.key} onClick={() => go(s.key)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-neutral-50">
                  <LayoutGrid className="h-4 w-4 text-neutral-400" /> {s.label}
                </button>
              ))}
            </div>
          )}

          {data && data.products.length > 0 && (
            <div className="border-b border-neutral-100 py-1">
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                {L("Produktet", "Products")}
              </div>
              {data.products.map((p) => (
                <button key={p.id} onClick={() => go("products")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-neutral-50">
                  <Package className="h-4 w-4 shrink-0 text-neutral-400" />
                  <span className="min-w-0">
                    <span className="block truncate">{p.name}</span>
                    {(p.sku || p.barcode) && (
                      <span className="block text-xs text-neutral-400">{[p.sku, p.barcode].filter(Boolean).join(" · ")}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {data && data.orders.length > 0 && (
            <div className="border-b border-neutral-100 py-1">
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                {L("Porositë", "Orders")}
              </div>
              {data.orders.map((o) => (
                <button key={o.id} onClick={() => go("orders")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-neutral-50">
                  <ShoppingCart className="h-4 w-4 shrink-0 text-neutral-400" />
                  <span className="min-w-0">
                    <span className="block font-medium">#{o.order_number}</span>
                    <span className="block truncate text-xs text-neutral-400">{o.customer_name}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {data && data.customers.length > 0 && (
            <div className="py-1">
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                {L("Klientët", "Customers")}
              </div>
              {data.customers.map((c, i) => (
                <button key={i} onClick={() => go("customers")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-neutral-50">
                  <Users className="h-4 w-4 shrink-0 text-neutral-400" />
                  <span className="min-w-0">
                    <span className="block truncate">{c.name}</span>
                    <span className="block truncate text-xs text-neutral-400">{c.email ?? c.phone ?? ""}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
