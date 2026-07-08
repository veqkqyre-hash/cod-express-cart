import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useCart, formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

export type Product = {
  id: string;
  slug: string;
  name_sq: string;
  name_en: string;
  price: number;
  image_url: string | null;
  stock: number;
};

export function ProductCard({ p }: { p: Product }) {
  const { lang, tr } = useI18n();
  const { add } = useCart();
  const name = lang === "sq" ? p.name_sq : p.name_en;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-elev">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="relative aspect-square overflow-hidden bg-muted">
        {p.image_url ? (
          <img src={p.image_url} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blush to-cream" />
        )}
        {p.stock === 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground">
            {tr("outOfStock")}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="font-medium leading-snug hover:text-primary line-clamp-2 min-h-[3rem]">
          {name}
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-display text-xl">{formatEur(Number(p.price))}</span>
          <button
            disabled={p.stock === 0}
            onClick={() => {
              add({ id: p.id, slug: p.slug, name, price: Number(p.price), image: p.image_url });
              toast.success(lang === "sq" ? "U shtua në shportë" : "Added to cart");
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            aria-label={tr("addToCart")}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
