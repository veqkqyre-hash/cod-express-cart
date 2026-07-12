import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ProductCard, type Product } from "@/components/product-card";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Award, Heart, Star, Instagram, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Home });

// Category card visuals — soft pink illustrated tiles
const CATEGORY_ART: Record<string, { hue: string; emoji: string }> = {
  "hair-care": { hue: "from-pink-100 to-white", emoji: "💗" },
  "hair-color": { hue: "from-rose-100 to-white", emoji: "🎨" },
  barber: { hue: "from-neutral-100 to-white", emoji: "✂️" },
  nails: { hue: "from-pink-50 to-white", emoji: "💅" },
  makeup: { hue: "from-fuchsia-100 to-white", emoji: "💄" },
  eyelashes: { hue: "from-rose-50 to-white", emoji: "👁️" },
  waxing: { hue: "from-amber-50 to-white", emoji: "🕯️" },
  equipment: { hue: "from-slate-100 to-white", emoji: "⚙️" },
  "salon-equipment": { hue: "from-slate-100 to-white", emoji: "⚙️" },
  furniture: { hue: "from-neutral-100 to-white", emoji: "🪑" },
  accessories: { hue: "from-pink-100 to-white", emoji: "✨" },
  "professional-accessories": { hue: "from-pink-100 to-white", emoji: "✨" },
};

function Home() {
  const { tr, lang } = useI18n();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const featured = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,slug,name_sq,name_en,price,image_url,stock")
        .eq("active", true).eq("featured", true).limit(8);
      return (data ?? []) as Product[];
    },
  });

  const newArrivals = useQuery({
    queryKey: ["home-new"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,slug,name_sq,name_en,price,image_url,stock")
        .eq("active", true).order("created_at", { ascending: false }).limit(8);
      return (data ?? []) as Product[];
    },
  });

  return (
    <div className="overflow-x-hidden">
      <Hero />
      <Marquee />
      <FeaturedCategories categories={categories.data ?? []} lang={lang} />
      <PromoDuo />
      <ProductSection
        eyebrow={tr("bestSellers")}
        title={tr("bestSellersTitle")}
        subtitle={tr("bestSellersSub")}
        products={featured.data ?? []}
      />
      <PromoWide />
      <ProductSection
        eyebrow={tr("newArrivals")}
        title={tr("newArrivalsTitle")}
        subtitle={tr("newArrivalsSub")}
        products={newArrivals.data ?? []}
      />
      <TopBrands />
      <WhyChooseUs />
      <Reviews />
      <InstagramGallery />
      <Newsletter />
    </div>
  );
}

/* ------------------------------ Sections ------------------------------ */

const HERO_SLIDES = [
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85",
  "https://images.unsplash.com/photo-1639629509821-c54cdd984227?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85",
  "https://images.pexels.com/photos/9774854/pexels-photo-9774854.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=1920",
];

function Hero() {
  const { tr } = useI18n();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(id);
  }, []);

  const prev = () => setIdx((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = () => setIdx((i) => (i + 1) % HERO_SLIDES.length);

  return (
    <section className="relative overflow-hidden bg-black">
      {/* Rotating background images */}
      {HERO_SLIDES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          width={1920}
          height={1080}
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${i === idx ? "opacity-70" : "opacity-0"}`}
        />
      ))}
      {/* Overlays for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[var(--pink-deep)]/25 blur-3xl" />

      {/* Prev / next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 grid h-11 w-11 md:h-12 md:w-12 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 grid h-11 w-11 md:h-12 md:w-12 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="container-app relative py-24 md:py-32 lg:py-40 min-h-[620px] flex items-center">
        <div className="max-w-2xl space-y-7 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur">
            <Sparkles className="h-3 w-3 text-[var(--pink)]" /> {tr("heroBadge")}
          </span>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            {tr("heroLine1")}
            <br />
            <span className="relative inline-block mt-3">
              <span className="absolute inset-0 -skew-y-2 rounded-2xl bg-[var(--pink-deep)] -z-0" aria-hidden />
              <span className="relative italic px-5 py-1.5 text-white">{tr("heroLine2")}</span>
            </span>
          </h1>
          <p className="max-w-lg text-base text-white/85 md:text-lg">{tr("heroSub2")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--pink-deep)] px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white shadow-pink transition hover:bg-[var(--pink)]"
            >
              {tr("shopNow")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#categories"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white backdrop-blur transition hover:bg-white/20"
            >
              {tr("shopCategories")}
            </a>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 pt-4 text-xs text-white/80">
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-[var(--pink)]" /> {tr("freeShippingBanner")}</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--pink)]" /> {tr("codShort")}</div>
            <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[var(--pink)]" /> {tr("qualityBadge")}</div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-10 bg-[var(--pink-deep)]" : "w-5 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </section>
  );
}

function Marquee() {
  const { tr } = useI18n();
  const items = [tr("marq1"), tr("marq2"), tr("marq3"), tr("marq4"), tr("marq5")];
  const line = [...items, ...items];
  return (
    <div className="border-y border-black/10 bg-black text-white overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee py-3.5">
        {line.map((t, i) => (
          <span key={i} className="mx-8 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em]">
            <Sparkles className="h-3 w-3 text-[var(--pink)]" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeaturedCategories({ categories, lang }: { categories: any[]; lang: "sq" | "en" | "de" }) {
  const { tr } = useI18n();
  return (
    <section id="categories" className="container-app py-20">
      <SectionHead eyebrow={tr("categories")} title={tr("shopByCategory")} subtitle={tr("shopByCategorySub")} />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((c) => {
          const art = CATEGORY_ART[c.slug] ?? { hue: "from-pink-50 to-white", emoji: "✨" };
          return (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-gradient-to-br ${art.hue} p-6 text-center aspect-square transition duration-300 hover:-translate-y-1 hover:shadow-elev hover:border-[var(--pink-deep)]/30`}
            >
              <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-[var(--pink)]/25 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative text-4xl md:text-5xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                {art.emoji}
              </div>
              <div className="relative mt-3 text-sm font-semibold">{lang === "sq" ? c.name_sq : c.name_en}</div>
              <div className="relative mt-1 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-[var(--pink-deep)]">
                {tr("explore")} →
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PromoDuo() {
  const { tr, lang } = useI18n();
  return (
    <section className="container-app grid gap-4 md:grid-cols-2">
      <div className="relative overflow-hidden rounded-3xl bg-[var(--pink-soft)] p-8 md:p-10 min-h-[280px] group">
        <div className="absolute -right-8 -bottom-8 text-[10rem] opacity-40 transition-transform duration-500 group-hover:scale-110">💄</div>
        <div className="relative max-w-xs">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pink-deep)]">{tr("summerCollection")}</div>
          <h3 className="mt-2 font-display text-3xl md:text-4xl leading-tight">{tr("promoDuo1Title")}</h3>
          <p className="mt-3 text-sm text-muted-foreground">{tr("promoDuo1Sub")}</p>
          <Link to="/shop" search={{ category: "makeup" }} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[var(--pink-deep)] transition">
            {tr("discover")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-black p-8 md:p-10 min-h-[280px] group text-white">
        <div className="absolute -right-8 -bottom-8 text-[10rem] opacity-30 transition-transform duration-500 group-hover:scale-110">✂️</div>
        <div className="relative max-w-xs">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pink)]">{tr("proExclusive")}</div>
          <h3 className="mt-2 font-display text-3xl md:text-4xl leading-tight">{tr("promoDuo2Title")}</h3>
          <p className="mt-3 text-sm text-white/70">{tr("promoDuo2Sub")}</p>
          <Link to="/shop" search={{ category: "barber" }} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--pink-deep)] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[var(--pink)] transition">
            {tr("shopNow")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PromoWide() {
  const { tr } = useI18n();
  return (
    <section className="container-app py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[var(--pink-deep)] via-[var(--pink)] to-[var(--pink-deep)] p-10 md:p-16 text-white shadow-pink">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-black/20 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">{tr("megaSale")}</div>
            <h3 className="mt-3 font-display text-4xl md:text-5xl leading-tight">{tr("promoWideTitle")}</h3>
            <p className="mt-3 max-w-md text-sm md:text-base text-white/85">{tr("promoWideSub")}</p>
            <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white hover:bg-white hover:text-black transition">
              {tr("shopSale")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {[
              { n: "72", l: tr("hours") },
              { n: "40", l: "% OFF" },
              { n: "500+", l: tr("productsCount") },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white/15 backdrop-blur-md p-5 text-center border border-white/20">
                <div className="font-display text-3xl md:text-4xl">{s.n}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductSection({ eyebrow, title, subtitle, products }: { eyebrow: string; title: string; subtitle: string; products: Product[] }) {
  const { tr } = useI18n();
  return (
    <section className="container-app py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <SectionHead eyebrow={eyebrow} title={title} subtitle={subtitle} align="left" />
        <Link to="/shop" className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-black hover:text-[var(--pink-deep)] transition">
          {tr("viewAll")} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-[var(--pink-soft)]/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </section>
  );
}

const BRANDS = ["L'ORÉAL", "WELLA", "SCHWARZKOPF", "OPI", "MAC", "REVLON", "OLAPLEX", "REDKEN"];
function TopBrands() {
  const { tr } = useI18n();
  return (
    <section id="brands" className="border-y border-border bg-[var(--pink-soft)]/40 py-16">
      <div className="container-app">
        <SectionHead eyebrow={tr("brands")} title={tr("topBrandsTitle")} subtitle={tr("topBrandsSub")} />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BRANDS.map((b) => (
            <div key={b} className="group grid h-20 place-items-center rounded-2xl bg-white border border-border transition hover:-translate-y-1 hover:shadow-soft hover:border-[var(--pink-deep)]/40">
              <span className="font-display text-sm tracking-[0.2em] text-black/70 transition group-hover:text-[var(--pink-deep)]">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  const { tr } = useI18n();
  const items = [
    { icon: Award, title: tr("whyPremiumTitle"), sub: tr("whyPremiumSub") },
    { icon: Truck, title: tr("whyShippingTitle"), sub: tr("whyShippingSub") },
    { icon: ShieldCheck, title: tr("whyCodTitle"), sub: tr("whyCodSub") },
    { icon: Heart, title: tr("whyCareTitle"), sub: tr("whyCareSub") },
  ];
  return (
    <section className="container-app py-20">
      <SectionHead eyebrow={tr("whyUs")} title={tr("whyUsTitle")} subtitle={tr("whyUsSub")} />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <div key={i} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 transition duration-300 hover:-translate-y-1 hover:shadow-elev">
            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-[var(--pink-soft)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-black text-white transition group-hover:bg-[var(--pink-deep)]">
              <it.icon className="h-6 w-6" />
            </span>
            <h4 className="relative mt-5 font-display text-xl">{it.title}</h4>
            <p className="relative mt-2 text-sm text-muted-foreground">{it.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: "Erblina K.", role: "Salon Owner, Prishtinë", text: { sq: "Cilësia më ka lënë pa fjalë. Porosia më erdhi shpejt dhe pagesa në derë ishte super komode.", en: "The quality left me speechless. My order arrived fast and paying at the door was so convenient." } },
  { name: "Fatjona M.", role: "Makeup Artist", text: { sq: "Produktet janë të freskëta e origjinale, çmimet më të mira në treg. Klientët e mi janë shumë të kënaqur.", en: "Products are fresh and authentic, best prices around. My clients are thrilled." } },
  { name: "Diellza R.", role: "Nail Technician", text: { sq: "Shërbimi i klientit është i shkëlqyer. Do të porosis prapë pa asnjë hezitim.", en: "Customer service is outstanding. I'll be ordering again without hesitation." } },
];
function Reviews() {
  const { tr, lang } = useI18n();
  return (
    <section className="border-y border-border bg-[var(--pink-soft)]/40 py-20">
      <div className="container-app">
        <SectionHead eyebrow={tr("reviews")} title={tr("reviewsTitle")} subtitle={tr("reviewsSub")} />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="relative rounded-3xl bg-white p-8 shadow-soft border border-border">
              <div className="absolute -top-4 left-6 font-display text-6xl text-[var(--pink-deep)] leading-none">"</div>
              <div className="flex text-[var(--gold)] mb-4">
                {[0,1,2,3,4].map((s) => <Star key={s} className="h-4 w-4 fill-current" strokeWidth={1.5} />)}
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">{t.text[lang === "sq" ? "sq" : "en"]}</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--pink-soft)] font-display text-sm text-[var(--pink-deep)]">
                  {t.name.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const INSTA = ["💄","💅","💇‍♀️","💗","✨","💋"];
function InstagramGallery() {
  const { tr, lang } = useI18n();
  return (
    <section className="container-app py-20">
      <div className="text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--pink-deep)]">@pink.salon</div>
        <h2 className="mt-3 font-display text-4xl md:text-5xl">{tr("followUs")}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{lang === "sq" ? "Bashkohuni me komunitetin tonë të bukurisë." : "Join our beauty community."}</p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {INSTA.map((e, i) => (
          <a key={i} href="#" className="group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--pink-soft)] via-white to-[var(--pink)]/30 grid place-items-center">
            <span className="text-5xl transition duration-500 group-hover:scale-110 group-hover:rotate-6">{e}</span>
            <div className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Instagram className="h-6 w-6 text-white" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  const { tr, lang } = useI18n();
  const [email, setEmail] = useState("");
  return (
    <section className="container-app py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-black p-10 md:p-16 text-white text-center shadow-elev">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,var(--pink-deep),transparent_60%)]" />
        <div className="relative mx-auto max-w-xl">
          <Mail className="mx-auto h-8 w-8 text-[var(--pink)]" />
          <h2 className="mt-4 font-display text-4xl md:text-5xl leading-tight">{tr("newsletterTitle")}</h2>
          <p className="mt-3 text-sm md:text-base text-white/70">{tr("newsletterSub")}</p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (!email.includes("@")) return; toast.success(lang === "sq" ? "Faleminderit që u regjistruat!" : "Thanks for subscribing!"); setEmail(""); }}
            className="mt-8 flex flex-col sm:flex-row gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 p-1.5"
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder={tr("emailPlaceholder")}
              className="flex-1 rounded-full bg-transparent px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none"
            />
            <button className="rounded-full bg-[var(--pink-deep)] px-7 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[var(--pink)] transition">
              {tr("subscribe")}
            </button>
          </form>
          <p className="mt-4 text-[11px] text-white/50">{tr("newsletterFine")}</p>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, subtitle, align = "center" }: { eyebrow: string; title: string; subtitle?: string; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--pink-deep)]">{eyebrow}</div>
      <h2 className="mt-3 font-display text-4xl md:text-5xl leading-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-sm md:text-base text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
