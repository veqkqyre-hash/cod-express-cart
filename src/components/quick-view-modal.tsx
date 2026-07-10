import { Link } from "@tanstack/react-router";
import { X, Star, ShoppingBag, Heart, Truck, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import type { Product } from "@/components/product-card";

export function QuickViewModal({
  product,
  rating,
  reviews,
  oldPrice,
  onClose,
  onAdd,
}: {
  product: Product;
  rating: number;
  reviews: number;
  oldPrice: number | null;
  onClose: () => void;
  onAdd: () => void;
}) {
  const { lang, tr } = useI18n();
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const name = lang === "sq" ? product.name_sq : product.name_en;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-background shadow-elev animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur hover:bg-[var(--pink-soft)]"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square bg-[var(--pink-soft)]">
            {product.image_url ? (
              <img src={product.image_url} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[var(--pink-soft)] to-white" />
            )}
          </div>
          <div className="flex flex-col gap-4 p-6 md:p-8">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="flex text-[var(--gold)]">
                {[0,1,2,3,4].map((i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-current" : ""}`} strokeWidth={1.5} />
                ))}
              </div>
              <span>{rating.toFixed(1)} · {reviews} {lang === "sq" ? "vlerësime" : "reviews"}</span>
            </div>
            <h2 className="font-display text-2xl leading-tight">{name}</h2>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl text-[var(--pink-deep)]">{formatEur(Number(product.price))}</span>
              {oldPrice && <span className="text-sm text-muted-foreground line-through">{formatEur(oldPrice)}</span>}
            </div>
            <p className="text-sm text-muted-foreground">
              {lang === "sq"
                ? "Produkt profesional për sallone bukurie. Cilësi premium, i testuar dhe i preferuar nga profesionistët."
                : "Professional beauty salon supply. Premium quality, tested and trusted by professionals."}
            </p>

            <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-[var(--pink-deep)]" /> {tr("freeShippingBanner")}</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--pink-deep)]" /> {tr("codShort")}</div>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                disabled={product.stock === 0}
                onClick={() => { onAdd(); onClose(); }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--pink-deep)] disabled:opacity-40"
              >
                <ShoppingBag className="h-4 w-4" /> {tr("addToCart")}
              </button>
              <button
                onClick={() => toggle(product.id)}
                aria-label={tr("wishlist")}
                className={`grid h-12 w-12 place-items-center rounded-full border transition ${wished ? "border-[var(--pink-deep)] bg-[var(--pink-deep)] text-white" : "border-border hover:bg-[var(--pink-soft)]"}`}
              >
                <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
              </button>
            </div>

            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              onClick={onClose}
              className="mt-1 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-[var(--pink-deep)] hover:underline"
            >
              {lang === "sq" ? "Shiko detajet e produktit" : "View full details"} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
