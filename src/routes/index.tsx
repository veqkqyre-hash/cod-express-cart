import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ProductCard, type Product } from "@/components/product-card";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { tr, lang } = useI18n();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const featured = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name_sq,name_en,price,image_url,stock")
        .eq("active", true)
        .eq("featured", true)
        .limit(8);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="container-app grid gap-10 py-12 md:py-20 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-block rounded-full bg-accent px-4 py-1 text-xs font-medium text-accent-foreground">
              {tr("cod")} — {tr("codDesc")}
            </span>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
              {tr("heroTitle")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">{tr("heroSubtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elev hover:bg-primary/90 transition">
                {tr("shopNow")}
              </Link>
              <a href="#categories" className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition">
                {tr("categories")}
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blush to-cream blur-2xl opacity-70" />
            <img
              src={heroImg}
              alt="Beauty salon supplies"
              width={1600}
              height={1000}
              className="relative rounded-3xl shadow-elev aspect-[4/3] object-cover"
            />
          </div>
        </div>
      </section>

      <section id="categories" className="container-app py-12">
        <h2 className="font-display text-3xl mb-8">{tr("categories")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {categories.data?.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className="group rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-elev"
            >
              <div className="text-sm font-medium">{lang === "sq" ? c.name_sq : c.name_en}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-app py-12">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl">{tr("featured")}</h2>
          <Link to="/shop" className="text-sm text-primary hover:underline">{tr("viewAll")} →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.data?.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}
