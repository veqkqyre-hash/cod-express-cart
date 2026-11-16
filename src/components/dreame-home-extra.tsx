import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/product-card";
import heroModel from "@/assets/dreame-home/hero-model.jpg";
import c0 from "@/assets/dreame-home/cat-0.jpg";
import c1 from "@/assets/dreame-home/cat-1.jpg";
import c2 from "@/assets/dreame-home/cat-2.jpg";
import c3 from "@/assets/dreame-home/cat-3.jpg";
import c4 from "@/assets/dreame-home/cat-4.jpg";
import c5 from "@/assets/dreame-home/cat-5.jpg";
import p0 from "@/assets/dreame-home/promo-0.jpg";
import p1 from "@/assets/dreame-home/promo-1.jpg";
import p2 from "@/assets/dreame-home/promo-2.jpg";

const CATS = [
  { img: c0, label: "Nail Care", slug: "nail-art" },
  { img: c1, label: "Gel Polish", slug: "llak-gel" },
  { img: c2, label: "Builder Gel", slug: "builder-gel" },
  { img: c3, label: "Tools & Accessories", slug: "lime-instrumente" },
  { img: c4, label: "Foot Care", slug: "pedikyr" },
  { img: c5, label: "Cleaner & Acetone", slug: "baze-top-coat" },
];

export function DreameHomeExtra() {
  const best = useQuery({
    queryKey: ["home-dreame-best"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,slug,name_sq,name_en,price,image_url,stock,discount_active,discount_percent")
        .eq("active", true).gt("stock", 0).not("image_url", "is", null)
        .order("created_at", { ascending: true }).limit(6);
      return (data ?? []) as Product[];
    },
  });

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="container-app pt-12">
        <div className="relative overflow-hidden rounded-2xl bg-card text-foreground border border-border">
          <div className="grid md:grid-cols-2">
            <div className="relative z-10 flex flex-col justify-center p-8 md:p-12">
              <p className="text-[11px] tracking-[0.3em] opacity-80">PROFESSIONAL BEAUTY SOLUTIONS</p>
              <h2 className="mt-3 font-display text-5xl leading-none md:text-7xl">DREAMÈ</h2>
              <p className="font-display text-3xl italic md:text-5xl">Beauty Cosmetics</p>
              <p className="mt-4 text-sm md:text-lg opacity-90">Qualität. Eleganz. Perfektion.<br />Für deine Schönheit – jeden Tag.</p>
              <Link to="/shop" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">
                Jetzt entdecken <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <img src={heroModel} alt="DREAMÈ Beauty Cosmetics – Gel Polish, Cleaner und Builder Gel" className="h-64 w-full object-cover md:h-full" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-app pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATS.map((c) => (
            <Link key={c.label} to="/shop" search={{ category: c.slug } as any} className="group relative block aspect-[4/3] overflow-hidden rounded-xl">
              <img src={c.img} alt={c.label} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
              <div className="absolute bottom-2 left-3 text-background">
                <div className="text-sm font-semibold md:text-base">{c.label}</div>
                <div className="text-[11px] opacity-90">Shop now →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestseller */}
      {(best.data?.length ?? 0) > 0 && (
        <section className="container-app py-12">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <h2 className="font-display text-3xl italic md:text-4xl">Unsere Bestseller</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {best.data!.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* Promo banners */}
      <section className="container-app pb-16">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { img: p0, alt: "Für Nagelstudios – Professionelle Produkte für höchste Ansprüche", to: "/shop" as const },
            { img: p1, alt: "DREAMÈ Beauty Academy – Schulung & Weiterbildung", to: "/contact" as const },
            { img: p2, alt: "Für deine Füße – Pflege & Schönheit von Kopf bis Fuß", to: "/shop" as const },
          ].map((b) => (
            <Link key={b.alt} to={b.to} className="block overflow-hidden rounded-xl transition hover:opacity-95">
              <img src={b.img} alt={b.alt} loading="lazy" className="h-full w-full object-cover" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
