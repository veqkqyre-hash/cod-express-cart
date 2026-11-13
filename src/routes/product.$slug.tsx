import { loadSeo } from "@/lib/seo-loader";
import { applySeoHead } from "@/lib/seo";
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
import { Button } from "@/components/ui/button";
import { readSpecs, canBuyOption, optionPrice, salePrice, discountPercent } from "@/lib/product-options";
import type { CSSProperties } from "react";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => loadSeo(`/product/${params.slug}`),
  component: ProductPage,
  head: ({ params, loaderData }) => applySeoHead(loaderData?.seo, {
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Dreame Beauty Cosmetics` },
      { name: "description", content: "Produkt profesional për sallone bukurie nga Dreame Beauty Cosmetics, me pagesë në dorëzim në tërë Kosovën." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Dreame Beauty Cosmetics` },
      { property: "og:description", content: "Produkt profesional për sallone bukurie nga Dreame Beauty Cosmetics, me pagesë në dorëzim." },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `https://dreamebeautycosmetics.com/product/${params.slug}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `https://dreamebeautycosmetics.com/product/${params.slug}` }],
  }),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { tr, lang } = useI18n();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);

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
  const { data: variants, isLoading: variantsLoading, isError: variantsError } = useQuery({
    queryKey: ["product-variants", product?.id], enabled: Boolean(product?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("product_variants").select("*").eq("product_id", product?.id ?? "").eq("active", true).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const approved = (reviews ?? []).filter((r) => r.approved);
  const avgRating = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0;

  if (isLoading) return <div className="container-app py-20 text-center text-muted-foreground">…</div>;
  if (!product) return null;

  const name = lang === "sq" ? product.name_sq : product.name_en;
  const desc = lang === "sq" ? product.description_sq : product.description_en;
  const selected = variants?.find(v => v.id === variantId);
  const hasVariants = Boolean(variants?.length);
  const stock = hasVariants ? selected?.stock ?? 0 : product.stock;
  const basePrice = optionPrice(Number(product.price), selected);
  const pct = discountPercent(product);
  const price = salePrice(basePrice, product);
  const specs = readSpecs(product.specs);
  const images = product.images?.length ? product.images : product.image_url ? [product.image_url] : [];
  const optionImages = selected?.image_url ? [selected.image_url, ...images.filter(x => x !== selected.image_url)] : images;
  const canBuy = !variantsLoading && !variantsError && canBuyOption(hasVariants, selected, product.stock, qty);

  return (
    <div className="container-app py-10">
      <Link to="/shop" className="text-sm text-muted-foreground hover:text-primary">← {tr("shop")}</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery key={`${product.id}:${selected?.id ?? "base"}`} images={optionImages} name={name} />
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">{name}</h1>
          {approved.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Stars value={avgRating} size={16} />
              <span>{avgRating.toFixed(1)} · {approved.length} {lang === "sq" ? "vlerësime" : "reviews"}</span>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-baseline gap-3"><span className="font-display text-3xl text-primary">{formatEur(price)}</span>{pct > 0 && <><span className="text-lg text-muted-foreground line-through">{formatEur(basePrice)}</span><span className="rounded-full bg-destructive px-2.5 py-1 text-sm font-bold text-destructive-foreground">-{pct}%</span></>}</div>
          {desc && <p className="mt-6 text-muted-foreground leading-relaxed">{desc}</p>}

          {hasVariants && <fieldset className="mt-6">
            <legend className="text-sm font-medium mb-3">{lang === "sq" ? "Zgjidhni variantin" : "Choose an option"}{selected ? ` — ${lang === "sq" ? selected.name_sq : selected.name_en}` : ""}</legend>
            <div className="flex flex-wrap gap-3">{variants?.map(v => <Button key={v.id} type="button" variant="outline" aria-pressed={variantId === v.id} title={`${lang === "sq" ? v.name_sq : v.name_en} · ${v.stock}`} onClick={() => { setVariantId(v.id); setQty(1); }} className={`h-auto min-h-11 py-2 ${variantId === v.id ? "ring-2 ring-primary" : ""}`}>
              {v.color_hex && <span aria-hidden className="variant-swatch size-6 rounded-full border border-border shrink-0" style={{ "--swatch-color": v.color_hex } as CSSProperties} />}
              <span>{lang === "sq" ? v.name_sq : v.name_en}{v.stock === 0 ? ` — ${tr("outOfStock")}` : ""}</span>
            </Button>)}</div>
          </fieldset>}
          {variantsError && <p className="mt-4 text-sm text-destructive">{lang === "sq" ? "Variantet nuk u ngarkuan. Rifreskoni faqen." : "Options could not load. Refresh the page."}</p>}
          {(!hasVariants || selected) && <p className="mt-4 text-sm text-muted-foreground">{stock > 0 ? `${stock} ${lang === "sq" ? "në stok" : "in stock"}` : tr("outOfStock")}</p>}
          {specs.length > 0 && <table className="mt-6 w-full text-sm"><caption className="text-left font-medium mb-2">{lang === "sq" ? "Specifikimet" : "Specifications"}</caption><tbody>{specs.map(s => <tr key={s.name} className="border-b border-border"><th className="py-3 pr-4 text-left font-normal text-muted-foreground">{s.name}</th><td className="py-3 break-words">{s.value}</td></tr>)}</tbody></table>}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-input">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center hover:bg-muted rounded-l-full">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button disabled={qty >= stock} onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:bg-muted rounded-r-full disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              disabled={!canBuy}
              onClick={() => {
                if (!canBuy) return;
                add({ id: product.id, slug: product.slug, name, price, image: selected?.image_url ?? product.image_url, variantId: selected?.id, variantName: selected ? (lang === "sq" ? selected.name_sq : selected.name_en) : null }, qty);
                toast.success(lang === "sq" ? "U shtua në shportë" : "Added to cart");
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <ShoppingBag className="h-4 w-4" />
              {tr("addToCart")}
            </button>
          </div>

          {stock === 0 && (!hasVariants || selected) && <StockAlertForm productId={product.id} productName={name} />}

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
              price: salePrice(Number(product.price), product).toFixed(2),
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
