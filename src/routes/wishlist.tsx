import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/lib/wishlist";
import { useI18n } from "@/lib/i18n";
import { ProductCard, type Product } from "@/components/product-card";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "Lista e dëshirave — Dreame Beauty Cosmetics" },
      { name: "description", content: "Produktet e ruajtura që doni t'i porositni më vonë nga Dreame Beauty Cosmetics" },
      { property: "og:title", content: "Lista e dëshirave — Dreame Beauty Cosmetics" },
      { property: "og:description", content: "Produktet e ruajtura që doni t'i porositni më vonë nga Dreame Beauty Cosmetics" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cod-express-cart.lovable.app/wishlist" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://cod-express-cart.lovable.app/wishlist" }],
  }),
});

function WishlistPage() {
  const { tr, lang } = useI18n();
  const { ids, clear } = useWishlist();

  const { data: products } = useQuery({
    queryKey: ["wishlist", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("products")
        .select("id,slug,name_sq,name_en,price,image_url,stock")
        .in("id", ids)
        .eq("active", true);
      return (data ?? []) as Product[];
    },
  });

  return (
    <div className="container-app py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--pink-deep)]">{tr("wishlist")}</div>
          <h1 className="mt-2 font-display text-4xl">{tr("myWishlist")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{ids.length} {lang === "sq" ? "artikuj" : "items"}</p>
        </div>
        {ids.length > 0 && (
          <button onClick={clear} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-[var(--pink-deep)] transition">
            {lang === "sq" ? "Pastro të gjitha" : "Clear all"}
          </button>
        )}
      </div>
      {ids.length === 0 ? (
        <div className="rounded-3xl border border-border bg-[var(--pink-soft)]/40 py-20 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white shadow-soft">
            <Heart className="h-7 w-7 text-[var(--pink-deep)]" />
          </div>
          <p className="mt-6 text-muted-foreground">{lang === "sq" ? "Lista juaj është bosh." : "Your wishlist is empty."}</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-black px-7 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[var(--pink-deep)] transition">
            {tr("shopNow")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products?.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
