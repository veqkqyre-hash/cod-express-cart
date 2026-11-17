import { loadSeo } from "@/lib/seo-loader";
import { applySeoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ProductCard, type Product } from "@/components/product-card";
import { DreameHomeExtra, DreameHomePromos } from "@/components/dreame-home-extra";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Award, Heart, Star, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/")({
  loader: () => loadSeo("/"),
  component: Home,
  head: ({ loaderData }) => applySeoHead(loaderData?.seo, {
    meta: [
      { title: "Dreame Beauty Cosmetics — Produkte për Thonj, Shumicë & Pakicë" },
      { name: "description", content: "Produkte profesionale për thonj: gel lak, akrilik, gel ndërtues, freza, lampa UV/LED, tipsa, nail art dhe pedikyr. Shumicë e pakicë, pagesë në dorëzim në tërë Kosovën." },
      { property: "og:title", content: "Dreame Beauty Cosmetics — Produkte për Thonj, Shumicë & Pakicë" },
      { property: "og:description", content: "Gel lak, akrilik, freza, lampa UV/LED, tipsa, nail art dhe pedikyr — shumicë dhe pakicë, pagesë në dorëzim." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://dreamebeautycosmetics.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://dreamebeautycosmetics.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: "Dreame Beauty Cosmetics",
          description:
            "Produkte profesionale për thonj: gel lak, akrilik, gel ndërtues, freza, lampa UV/LED, tipsa, nail art dhe pedikyr. Shumicë e pakicë, pagesë në dorëzim në tërë Kosovën.",

          url: "https://dreamebeautycosmetics.com/",
          email: "info@dreamebeautycosmetics.com",
          priceRange: "€€",
          currenciesAccepted: "EUR",
          paymentAccepted: "Cash on Delivery",
          areaServed: "Kosovë",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Rr. Nëna Terezë",
            addressLocality: "Fushë Kosovë",
            postalCode: "12000",
            addressCountry: "XK",
          },
        }),
      },
    ],
  }),
});

// Category card visuals — nail-focused illustrated tiles
const CATEGORY_ART: Record<string, { hue: string; emoji: string }> = {
  "gel-lak": { hue: "from-pink-100 to-white", emoji: "💅" },
  "akrilik-pluhur": { hue: "from-rose-100 to-white", emoji: "🧁" },
  "gel-thonj": { hue: "from-fuchsia-100 to-white", emoji: "🪄" },
  "baze-top-coat": { hue: "from-pink-50 to-white", emoji: "🫧" },
  "freza-aparate": { hue: "from-slate-100 to-white", emoji: "🛠️" },
  "lampa-uv-led": { hue: "from-amber-50 to-white", emoji: "💡" },
  "lime-instrumente": { hue: "from-neutral-100 to-white", emoji: "✂️" },
  "tipsa-forma": { hue: "from-rose-50 to-white", emoji: "🤍" },
  "nail-art": { hue: "from-fuchsia-50 to-white", emoji: "✨" },
  pedikyr: { hue: "from-pink-50 to-white", emoji: "🦶" },
  higjena: { hue: "from-sky-50 to-white", emoji: "🧼" },
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

  const newArrivals = useQuery({
    queryKey: ["home-new"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,slug,name_sq,name_en,price,image_url,stock,discount_active,discount_percent")
        .eq("active", true).gt("stock", 0).order("created_at", { ascending: false }).limit(6);
      return (data ?? []) as Product[];
    },
  });

  return (
    <div className="overflow-x-hidden">
      <Hero />
      <DreameHomeExtra />
      <Marquee />
      <ProductSection
        eyebrow={tr("newArrivals")}
        title={tr("newArrivalsTitle")}
        subtitle={tr("newArrivalsSub")}
        products={newArrivals.data ?? []}
      />
      <DreameHomePromos />
      <Newsletter />
    </div>
  );
}

/* ------------------------------ Sections ------------------------------ */

const BRAND_HERO_COPY = {
  sq: { eyebrow: "ZGJIDHJE PROFESIONALE PËR BUKURI", line1: "Cilësi. Elegancë. Përsosmëri.", line2: "Për bukurinë tënde — çdo ditë." },
  en: { eyebrow: "PROFESSIONAL BEAUTY SOLUTIONS", line1: "Quality. Elegance. Perfection.", line2: "For your beauty — every day." },
  de: { eyebrow: "PROFESSIONELLE BEAUTY-LÖSUNGEN", line1: "Qualität. Eleganz. Perfektion.", line2: "Für deine Schönheit — jeden Tag." },
  fr: { eyebrow: "SOLUTIONS BEAUTÉ PROFESSIONNELLES", line1: "Qualité. Élégance. Perfection.", line2: "Pour votre beauté — chaque jour." },
} as const;

function Hero() {
  const { tr, lang } = useI18n();
  const brandCopy = BRAND_HERO_COPY[lang];

  return (
    <section
      aria-label={tr("heroBadge")}
      className="relative overflow-hidden bg-[#f7f0f3] text-[#241b20]"
    >
      <div className="container-app grid min-h-[450px] grid-cols-1 items-center gap-6 py-12 sm:py-16 lg:min-h-[490px] lg:grid-cols-2 lg:gap-12 lg:py-16">
        {/* Retain the original branding and call-to-action; no photo or black mask. */}
        <div className="relative z-10 max-w-xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.21em] text-[#614b56] sm:text-xs">
            {brandCopy.eyebrow}
          </p>
          <h1 className="font-display text-[clamp(2.9rem,5vw,5.8rem)] leading-[0.94] tracking-tight">
            DREAMÈ
          </h1>
          <p className="mt-1 font-display text-[clamp(1.5rem,2.8vw,3rem)] italic leading-tight">
            Beauty Cosmetics
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#51434b] sm:text-base">
            {brandCopy.line1}<br />{brandCopy.line2}
          </p>
          <Link
            to="/shop"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#241b20] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--pink-deep)]"
          >
            {tr("shopNow")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Outlined, textured triangle from the supplied reference replaces the model image. */}
        <div className="flex items-center justify-center py-2 sm:py-4 lg:py-0" aria-hidden="true">
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAA1CAMAAADiQZJeAAAAYFBMVEUkGyAkGyAkGyAkGyAkGyAkGyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO3pUDAAAAIHRSTlMA9VKvbs8vkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKVdoQcAAAH4SURBVHjatVZJksNACGPn/z8eQXc5XmK7c5hUZTkoihACQvSvD9df0MxsP6Aj2WMZbSzMuYy2VGOOVXS4k7MuKnEh4ViiZyoQ8A4572jhgWaRdzMBSiXzDGJ/rbarzCkq05/NZCla9f6oKflI7/2q1SDWINPUBzPZqu/qMjgtotTbLTohu5Q0pwlSo3oXHVQJ5a0beQRY6pfu6FGlzirBzP2upDfRGf1T3eJuxZ3d2vyWkz2akBfKLpflSg+pkKE707Q5BbIoz9Fx9JJj6t7oYTzDzKKXkxKjA/eotjQEgnZM5qzSj78YXpwRGEPM7YfKpXt5aXaZGWUu+06OC+bywj3MnEHS3OiRb1O5ons0CuNZ2mXrpX1Rot1VhK2Z/aaXG3GTGQw+9IhHjg7oWhdZnsCSPKQdurEe9uhBlmCJsuOcb8My0Z0VOkQE06mT5eBBSRNXURg5uS4YP1Q5UqrJJHEh/jiYu3jUNEDet1lGL4HvjVL96M3lLt+IG41dVftnLAaESMPybkloaM/tHNtCP+xDjaEYZPWEKn3YnSqlWaRDgANnrA+bLaUGah4sxyqSp62ZXaUVqHL/cq5ybntMONLydkxyXpLE197PLEBlBRK0cpJTEPlEiJYOpgXSFr546zFJkbl66BGklOX/EBidH/6fRND/PP4ATGkIortw38gAAAAASUVORK5CYII="
            alt=""
            className="h-auto w-[120px] object-contain sm:w-[155px] lg:w-[175px]"
          />
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const { tr } = useI18n();
  const items = [tr("marq1"), tr("marq2"), tr("marq3"), tr("marq5")];
  const line = [...items, ...items];
  return (
    <div className="border-y border-black/10 bg-black text-white overflow-hidden">
      <div className="flex w-max animate-marquee py-3.5">
        {line.map((t, i) => (
          <span
            key={i}
            className="mx-5 inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] sm:mx-8 sm:gap-3 sm:text-xs sm:tracking-[0.3em]"
          >
            <Sparkles className="h-3 w-3 shrink-0 text-[var(--pink)]" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeaturedCategories({ categories, lang }: { categories: any[]; lang: "sq" | "en" | "de" | "fr" }) {
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
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-[var(--pink-soft)]/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {products.map((p) => <ProductCard key={p.id} p={p} compact />)}
        </div>
      )}
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
    <section className="border-y border-border bg-secondary/40 py-20">
      <div className="container-app">
        <SectionHead eyebrow={tr("reviews")} title={tr("reviewsTitle")} subtitle={tr("reviewsSub")} />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="relative rounded-3xl bg-card p-8 shadow-soft border border-border">
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
