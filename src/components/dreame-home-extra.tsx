import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { whatsappLink } from "@/lib/business-whatsapp";
import { AppointmentBooking } from "@/components/appointment-booking";
import p0 from "@/assets/dreame-home/promo-0-photo.jpg";
import p1 from "@/assets/dreame-home/promo-1-photo.jpg";
import p2 from "@/assets/dreame-home/promo-2-photo.jpg";
type StripProduct = {
  id: string;
  slug: string;
  name_sq: string;
  name_en: string;
  image_url: string | null;
  category_id: string | null;
};

function ProductStripCard({ product, lang, duplicate = false }: { product: StripProduct; lang: "sq" | "en" | "de" | "fr"; duplicate?: boolean }) {
  const name = (lang === "sq" ? product.name_sq : product.name_en) || product.name_sq || product.name_en;
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      tabIndex={duplicate ? -1 : undefined}
      className="group relative block w-[185px] shrink-0 overflow-hidden rounded-xl border border-border bg-white sm:w-[210px] lg:w-[245px]"
      aria-label={name}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f7f0f3]">
        <img src={product.image_url!} alt="" aria-hidden="true" loading="lazy" className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
        <img
          src={product.image_url!}
          alt={name}
          loading="lazy"
          className="relative h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="px-3 py-3 text-foreground">
        <div className="line-clamp-2 text-xs font-semibold leading-snug sm:text-sm">{name}</div>
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {({ sq: "Shiko produktin", en: "View product", de: "Produkt ansehen", fr: "Voir le produit" } as const)[lang]} →
        </span>
      </div>
    </Link>
  );
}

export function DreameHomeExtra() {
  const { lang } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);
  const { data: products = [] } = useQuery({
    queryKey: ["home-real-products-strip"],
    queryFn: async (): Promise<StripProduct[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name_sq,name_en,image_url,category_id")
        .eq("active", true)
        .gt("stock", 0)
        .not("image_url", "is", null)
        .neq("image_url", "")
        .order("created_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      const available = (data ?? []).filter((p) => p.image_url && p.slug && (p.name_sq || p.name_en)) as StripProduct[];

      // Start with distinct real categories, then fill with other real products.
      const chosen: StripProduct[] = [];
      const seenCategories = new Set<string>();
      const seenProducts = new Set<string>();
      for (const p of available) {
        if (p.category_id && !seenCategories.has(p.category_id)) {
          chosen.push(p);
          seenCategories.add(p.category_id);
          seenProducts.add(p.id);
        }
        if (chosen.length >= 12) break;
      }
      for (const p of available) {
        if (chosen.length >= 12) break;
        if (!seenProducts.has(p.id)) { chosen.push(p); seenProducts.add(p.id); }
      }
      return chosen;
    },
    staleTime: 120_000,
  });

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || products.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let previous = 0;
    const animate = (timestamp: number) => {
      const elapsed = previous ? Math.min(timestamp - previous, 50) : 0;
      previous = timestamp;
      if (!pauseRef.current && !document.hidden) {
        const distance = viewport.scrollWidth / 2;
        if (distance > viewport.clientWidth) {
          viewport.scrollLeft += elapsed * 0.028;
          if (viewport.scrollLeft >= distance) viewport.scrollLeft -= distance;
        }
      }
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [products.length]);

  // If no existing, photographed products are available, don't show fake categories.
  if (products.length === 0) return null;

  return (
    <div className="bg-background">
      <section className="container-app pt-12 pb-8" aria-label={({ sq: "Produkte nga dyqani", en: "Products from our shop", de: "Produkte aus unserem Shop", fr: "Produits de notre boutique" } as const)[lang]}>
        <div
          ref={scrollRef}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onMouseEnter={() => { pauseRef.current = true; }}
          onMouseLeave={() => { pauseRef.current = false; }}
          onFocus={() => { pauseRef.current = true; }}
          onBlur={() => { pauseRef.current = false; }}
          onTouchStart={() => { pauseRef.current = true; }}
          onTouchEnd={() => { pauseRef.current = false; }}
        >
          <div className="flex w-max">
            <div className="flex shrink-0 gap-3 pr-3">
              {products.map((product) => <ProductStripCard key={product.id} product={product} lang={lang} />)}
            </div>
            {products.length > 1 && (
              <div className="flex shrink-0 gap-3 pr-3" aria-hidden="true">
                {products.map((product) => <ProductStripCard key={product.id} product={product} lang={lang} duplicate />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Kept separate so only the existing promo banners can be positioned lower on the homepage.
const PROMO_INFO = {
  sq: {
    studioTitle: "Furnizime profesionale për studiot e thonjve",
    studioBody: "Zbulo gel lak, builder gel, baza dhe top coat, freza, lampa UV/LED, pajisje dhe aksesorë për punë profesionale. Për sasi dhe furnizime për studio, na kontakto.",
    studioAction: "Shiko produktet",
    feetTitle: "Kujdes për këmbë dhe pedikyr",
    feetBody: "Produkte dhe aksesorë për pedikyr, higjienë dhe kujdes të këmbëve. Për trajtim ose termin, dërgo një kërkesë me datën dhe orën që preferon.",
    feetAction: "Kërko termin për pedikyr",
    academyMessage: "Përshëndetje, dua të regjistrohem në DREAMÈ Beauty Academy.\nEmri dhe mbiemri: ____\nTelefoni: ____\nTrajnimi që më intereson: ____\nJu lutem më dërgoni informata për trajnimet.",
  },
  en: {
    studioTitle: "Professional nail studio supplies",
    studioBody: "Explore gel polish, builder gel, base and top coats, nail drills, UV/LED lamps, tools and accessories for professional use. Contact us about studio supplies and quantities.",
    studioAction: "Explore products",
    feetTitle: "Foot care and pedicure",
    feetBody: "Products and accessories for pedicure, hygiene and foot care. For a treatment appointment, send your preferred date and time.",
    feetAction: "Request pedicure appointment",
    academyMessage: "Hello, I would like to register for DREAMÈ Beauty Academy.\nFull name: ____\nPhone: ____\nTraining of interest: ____\nPlease send me information about courses.",
  },
  de: {
    studioTitle: "Professioneller Nagelstudio-Bedarf",
    studioBody: "Entdecken Sie Gel-Lack, Aufbaugel, Base und Top Coat, Nagelfräser, UV/LED-Lampen, Werkzeuge und Zubehör. Kontaktieren Sie uns für Studio-Bestellungen.",
    studioAction: "Produkte ansehen",
    feetTitle: "Fußpflege und Pediküre",
    feetBody: "Produkte und Zubehör für Pediküre, Hygiene und Fußpflege. Für einen Behandlungstermin senden Sie uns Ihren Wunschtermin.",
    feetAction: "Pediküre-Termin anfragen",
    academyMessage: "Hallo, ich möchte mich bei DREAMÈ Beauty Academy anmelden.\nName: ____\nTelefon: ____\nGewünschte Schulung: ____\nBitte senden Sie mir Informationen.",
  },
  fr: {
    studioTitle: "Fournitures professionnelles pour salons d'ongles",
    studioBody: "Découvrez vernis gel, gel de construction, base et top coat, ponceuses, lampes UV/LED, outils et accessoires professionnels. Contactez-nous pour les commandes de salon.",
    studioAction: "Voir les produits",
    feetTitle: "Soins des pieds et pédicure",
    feetBody: "Produits et accessoires pour pédicure, hygiène et soins des pieds. Pour un rendez-vous, envoyez-nous vos préférences de date et d'heure.",
    feetAction: "Demander un rendez-vous pédicure",
    academyMessage: "Bonjour, je souhaite m'inscrire à DREAMÈ Beauty Academy.\nNom: ____\nTéléphone: ____\nFormation souhaitée: ____\nMerci de m'envoyer des informations.",
  },
} as const;

export function DreameHomePromos() {
  const { tr, lang } = useI18n();
  const info = PROMO_INFO[lang];
  const bookingRef = useRef<HTMLDetailsElement>(null);
  function revealBooking() {
    if (bookingRef.current) bookingRef.current.open = true;
  }
  useEffect(() => {
    function revealFromHash() {
      if (window.location.hash === "#rezervo-termin") {
        revealBooking();
        document.getElementById("rezervo-termin")?.scrollIntoView({ block: "start" });
      }
    }
    revealFromHash();
    window.addEventListener("hashchange", revealFromHash);
    return () => window.removeEventListener("hashchange", revealFromHash);
  }, []);
  const bookingLabel = ({ sq: "Cakto termin", en: "Book appointment", de: "Termin vereinbaren", fr: "Prendre rendez-vous" } as const)[lang];
  const promos = [
    {
      img: p0,
      title: ({ sq: "Cakto Termin Online", en: "Book an Appointment Online", de: "Termin online buchen", fr: "Prendre rendez-vous en ligne" } as const)[lang],
      sub: ({ sq: "Zgjedh datën dhe orën që të përshtatet.", en: "Choose the date and time that suits you.", de: "Wähle dein passendes Datum und deine Uhrzeit.", fr: "Choisissez la date et l'heure qui vous conviennent." } as const)[lang],
      btn: ({ sq: "Cakto Termin Online", en: "Book Online", de: "Online buchen", fr: "Réserver en ligne" } as const)[lang],
      href: "#rezervo-termin",
      photoLeft: true,
      external: false,
    },
    { img: p1, title: tr("promoAcademyTitle"), sub: tr("promoAcademySub"), btn: tr("promoAcademyBtn"), href: whatsappLink(info.academyMessage), photoLeft: false, external: true },
    { img: p2, title: tr("promoFeetTitle"), sub: tr("promoFeetSub"), btn: tr("promoLearnMore"), href: "#feet-info", photoLeft: true, external: false },
  ];
  return (
    <div className="bg-background">
      {/* Existing promotional cards: images, titles and layout remain unchanged. */}
      <section className="container-app pb-12">
        <div className="grid gap-3 md:grid-cols-3">
          {promos.map((p) => (
            <a key={p.title} href={p.href} onClick={p.href === "#rezervo-termin" ? revealBooking : undefined} target={p.external ? "_blank" : undefined} rel={p.external ? "noopener noreferrer" : undefined} className="group flex overflow-hidden rounded-xl bg-foreground text-background">
              {p.photoLeft && <img src={p.img} alt="" loading="lazy" className="w-24 shrink-0 object-cover sm:w-28" />}
              <div className="flex flex-1 flex-col justify-center gap-1.5 p-4">
                <div className="font-display text-lg leading-tight">{p.title}</div>
                <div className="text-xs opacity-80">{p.sub}</div>
                <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-background px-4 py-1.5 text-xs font-semibold text-foreground">
                  {p.btn} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              {!p.photoLeft && <img src={p.img} alt="" loading="lazy" className="w-24 shrink-0 object-cover sm:w-28" />}
            </a>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article id="studio-info" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 text-foreground">
            <h3 className="font-display text-xl">{info.studioTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{info.studioBody}</p>
            <a href="#rezervo-termin" onClick={revealBooking} className="mt-4 mr-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--pink-deep)] hover:underline">
              {bookingLabel} <ArrowRight className="h-4 w-4" />
            </a>
            <Link to="/shop" search={{}} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--pink-deep)] hover:underline">
              {info.studioAction} <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
          <article id="feet-info" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 text-foreground">
            <h3 className="font-display text-xl">{info.feetTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{info.feetBody}</p>
            <a href="/#rezervo-termin" onClick={revealBooking} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--pink-deep)] hover:underline">
              {info.feetAction} <ArrowRight className="h-4 w-4" />
            </a>
          </article>
        </div>
        <details id="rezervo-termin" ref={bookingRef} className="mt-5 scroll-mt-28 rounded-2xl border border-border bg-card p-5 text-foreground sm:p-8">
          <summary className="cursor-pointer text-base font-semibold text-[var(--pink-deep)] marker:text-[var(--pink-deep)]">{bookingLabel}</summary>
          <AppointmentBooking embedded />
        </details>
      </section>
    </div>
  );
}
