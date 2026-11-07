import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCart, formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { ProductReviews, Stars, useReviews } from "@/components/product-reviews";
import { StockAlertForm } from "@/components/newsletter-signup";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Dreame Beauty Cosmetics` },
      { name: "description", content: "Produkt profesional për sallone bukurie nga Dreame Beauty Cosmetics, me pagesë në dorëzim në tërë Kosovën." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Dreame Beauty Cosmetics` },
      { property: "og:description", content: "Produkt profesional për sallone bukurie nga Dreame Beauty Cosmetics, me pagesë në dorëzim." },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `https://cod-express-cart.lovable.app/product/${params.slug}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `https://cod-express-cart.lovable.app/product/${params.slug}` }],
  }),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { tr, lang } = useI18n();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).eq("active", true).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: reviews } = useReviews(product?.id);
  const approved = (reviews ?? []).filter((r) => r.approved);
  const avgRating = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0;

  if (isLoading) return <div className="container-app py-20 text-center text-muted-foreground">…</div>;
  if (!product) return null;

  const name = lang === "sq" ? product.name_sq : product.name_en;
  const desc = lang === "sq" ? product.description_sq : product.description_en;

  return (
    <div className="container-app py-10">
      <Link to="/shop" className="text-sm text-muted-foreground hover:text-primary">← {tr("shop")}</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={(product.images?.length ? product.images : product.image_url ? [product.image_url] : [])} name={name} />
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">{name}</h1>
          {approved.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Stars value={avgRating} size={16} />
              <span>{avgRating.toFixed(1)} · {approved.length} {lang === "sq" ? "vlerësime" : "reviews"}</span>
            </div>
          )}
          <div className="mt-4 font-display text-3xl text-primary">{formatEur(Number(product.price))}</div>
          {desc && <p className="mt-6 text-muted-foreground leading-relaxed">{desc}</p>}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-input">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center hover:bg-muted rounded-l-full">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:bg-muted rounded-r-full">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              disabled={product.stock === 0}
              onClick={() => {
                add({ id: product.id, slug: product.slug, name, price: Number(product.price), image: product.image_url }, qty);
                toast.success(lang === "sq" ? "U shtua në shportë" : "Added to cart");
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <ShoppingBag className="h-4 w-4" />
              {tr("addToCart")}
            </button>
          </div>

          {product.stock === 0 && <StockAlertForm productId={product.id} productName={name} />}

          <div className="mt-8 rounded-2xl border border-border bg-accent/40 p-5">
            <div className="font-medium">{tr("cod")}</div>
            <div className="text-sm text-muted-foreground mt-1">{tr("codDesc")}</div>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            description: desc ?? undefined,
            image: product.image_url ?? undefined,
            sku: product.sku ?? undefined,
            gtin: product.barcode ?? undefined,
            brand: { "@type": "Brand", name: "Dreame Beauty Cosmetics" },
            offers: {
              "@type": "Offer",
              price: Number(product.price).toFixed(2),
              priceCurrency: "EUR",
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `https://dreamebeautycosmetics.com/product/${product.slug}`,
            },
            ...(approved.length > 0
              ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: approved.length } }
              : {}),
          }),
        }}
      />
    </div>
  );
}

function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const cur = images[i] ?? images[0];
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-muted aspect-square">
        {cur && <img src={cur} alt={name} className="h-full w-full object-cover" />}
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Prev" onClick={() => setI((i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-xl shadow hover:bg-background">‹</button>
            <button type="button" aria-label="Next" onClick={() => setI((i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-xl shadow hover:bg-background">›</button>
            <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-xs shadow">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((u, k) => (
            <button key={u + k} type="button" onClick={() => setI(k)} className={`aspect-square overflow-hidden rounded-xl border-2 ${k === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}>
              <img src={u} alt={`${name} ${k + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
