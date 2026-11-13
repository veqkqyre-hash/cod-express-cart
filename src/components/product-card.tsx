import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useCart, formatEur } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { toast } from "sonner";
import { Heart, Eye, ShoppingBag, Star } from "lucide-react";
import { QuickViewModal } from "@/components/quick-view-modal";
import { salePrice, discountPercent } from "@/lib/product-options";

export type Product = {
  id: string;
  slug: string;
  name_sq: string;
  name_en: string;
  price: number;
  image_url: string | null;
  stock: number;
  discount_active?: boolean | null;
  discount_percent?: number | null;
};

// Deterministic pseudo-random 0..1 from id, used for consistent demo ratings / discounts
function seed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function ProductCard({ p }: { p: Product }) {
  const { lang, tr } = useI18n();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [quickOpen, setQuickOpen] = useState(false);

  const name = lang === "sq" ? p.name_sq : p.name_en;
  const s = useMemo(() => seed(p.id), [p.id]);
  const rating = 3.8 + s * 1.2;
  const reviews = Math.round(12 + s * 220);
  const pct = discountPercent(p);
  const price = salePrice(Number(p.price), p);
  const oldPrice = pct ? Number(p.price) : null; // Only a sale the admin activated.
  const wished = has(p.id);

  async function handleAdd() {
    const { count } = await supabase.from("product_variants").select("id", { count: "exact", head: true }).eq("product_id", p.id).eq("active", true);
    if (count && count > 0) {
      toast.info(lang === "sq" ? "Zgjidhni ngjyrën/variantin te faqja e produktit" : "Choose an option on the product page");
      window.location.href = `/product/${p.slug}`;
      return;
    }
    add({ id: p.id, slug: p.slug, name, price, image: p.image_url });
    toast.success(lang === "sq" ? "U shtua në shportë" : "Added to cart");
  }

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-elev">
        {/* Image */}
        <Link
          to="/product/$slug"
          params={{ slug: p.slug }}
          className="relative block aspect-square overflow-hidden bg-[var(--pink-soft)]"
        >
          {pct > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">-{pct}%</span>}
          {p.image_url ? (
            <>
              <img
                src={p.image_url}
                alt={name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110 group-hover:opacity-0"
              />
              <img
                src={p.image_url}
                alt=""
                aria-hidden
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-110 rotate-2 object-cover opacity-0 blur-[1px] brightness-105 transition duration-700 group-hover:scale-125 group-hover:rotate-0 group-hover:opacity-100 group-hover:blur-0"
              />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[var(--pink-soft)] via-white to-[var(--pink-soft)]" />
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {p.stock === 0 && (
              <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {tr("outOfStock")}
              </span>
            )}
          </div>

          {/* Side actions — slide in on hover (desktop), always visible on touch */}
          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-100 translate-x-0 md:opacity-0 md:translate-x-3 transition duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            <button
              onClick={(e) => { e.preventDefault(); toggle(p.id); }}
              aria-label={tr("wishlist")}
              className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition ${wished ? "bg-[var(--pink-deep)] text-white" : "bg-white/90 text-black hover:bg-[var(--pink-soft)]"}`}
            >
              <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setQuickOpen(true); }}
              aria-label={tr("quickView")}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-black backdrop-blur-md transition hover:bg-[var(--pink-soft)]"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          {/* Add to cart bar — slides up on hover */}
          <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              disabled={p.stock === 0}
              onClick={(e) => { e.preventDefault(); handleAdd(); }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-elev transition hover:bg-[var(--pink-deep)] disabled:opacity-40"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> {tr("addToCart")}
            </button>
          </div>
        </Link>

        {/* Meta */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <div className="flex text-[var(--gold)]">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.round(rating) ? "fill-current" : ""}`} strokeWidth={1.5} />
              ))}
            </div>
            <span>({reviews})</span>
          </div>
          <Link
            to="/product/$slug"
            params={{ slug: p.slug }}
            className="line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug transition-colors hover:text-[var(--pink-deep)]"
          >
            {name}
          </Link>
          <div className="mt-auto flex items-baseline gap-2">
            <span className="font-display text-lg text-[var(--pink-deep)]">{formatEur(price)}</span>
            {oldPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatEur(oldPrice)}</span>
            )}
          </div>
        </div>
      </div>

      {quickOpen && (
        <QuickViewModal
          product={p}
          rating={rating}
          reviews={reviews}
          oldPrice={oldPrice}
          onClose={() => setQuickOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}
