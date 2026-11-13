import { loadSeo } from "@/lib/seo-loader";
import { applySeoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ProductCard, type Product } from "@/components/product-card";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: (s) => searchSchema.parse(s),
  loader: () => loadSeo("/shop"),
  component: Shop,
  head: ({ loaderData }) => applySeoHead(loaderData?.seo, {
    meta: [
      { title: "Dyqani — Dreame Beauty Cosmetics" },
      { name: "description", content: "Blej produkte profesionale për thonj në Dreame Beauty Cosmetics: gel lak, akrilik, gel ndërtues, freza, lampa UV/LED, tipsa, nail art dhe pedikyr. Shumicë e pakicë, pagesa në dorëzim." },
      { property: "og:title", content: "Dyqani — Dreame Beauty Cosmetics" },
      { property: "og:description", content: "Blej produkte profesionale për thonj në Dreame Beauty Cosmetics: gel lak, akrilik, gel ndërtues, freza, lampa UV/LED, tipsa, nail art dhe pedikyr. Shumicë e pakicë, pagesa në dorëzim." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://dreamebeautycosmetics.com/shop" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://dreamebeautycosmetics.com/shop" }],
  }),
});

function Shop() {
  const { tr, lang } = useI18n();
  const { category, q } = Route.useSearch();
  const navigate = Route.useNavigate();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const products = useQuery({
    queryKey: ["products", category, q],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id,slug,name_sq,name_en,price,image_url,stock,discount_active,discount_percent,category_id")
        .eq("active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false });
      if (category) {
        const cat = categories.data?.find((c) => c.slug === category);
        if (cat) query = query.eq("category_id", cat.id);
      }
      if (q) query = query.or(`name_sq.ilike.%${q}%,name_en.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    enabled: !category || !!categories.data,
  });

  return (
    <div className="container-app py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl">{tr("shop")}</h1>
        <input
          type="search"
          placeholder={tr("search")}
          defaultValue={q ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            navigate({ search: (prev: { category?: string; q?: string }) => ({ ...prev, q: val || undefined }), replace: true });
          }}
          className="w-full sm:w-64 rounded-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          to="/shop"
          search={{}}
          className={`rounded-full px-4 py-2 text-sm transition ${!category ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
        >
          {tr("allProducts")}
        </Link>
        {categories.data?.map((c) => (
          <Link
            key={c.id}
            to="/shop"
            search={{ category: c.slug }}
            className={`rounded-full px-4 py-2 text-sm transition ${category === c.slug ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
          >
            {lang === "sq" ? c.name_sq : c.name_en}
          </Link>
        ))}
      </div>

      {products.isLoading ? (
        <div className="py-20 text-center text-muted-foreground">…</div>
      ) : products.data && products.data.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.data.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">{tr("noProducts")}</div>
      )}
    </div>
  );
}
