import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Gem, Truck, ShieldCheck, Headphones, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { whatsappLink } from "@/lib/business-whatsapp";
import { AppointmentBooking, type AppointmentMode } from "@/components/appointment-booking";
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
      className="group relative block w-[min(48vw,185px)] min-w-[145px] shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white text-[#241d20] sm:w-[210px] lg:w-[245px]"
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
      <div className="px-3 py-3 text-[#241d20]">
        <div className="line-clamp-2 text-xs font-semibold leading-snug sm:text-sm">{name}</div>
        <span className="mt-1 block text-[11px] text-neutral-600">
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
      <section className="container-app pt-7 pb-7 sm:pt-12 sm:pb-8" aria-label={({ sq: "Produkte nga dyqani", en: "Products from our shop", de: "Produkte aus unserem Shop", fr: "Produits de notre boutique" } as const)[lang]}>
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
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<AppointmentMode>("all");
  function revealBooking(mode: AppointmentMode = "all") {
    setBookingMode(mode);
    setBookingOpen(true);
  }
  useEffect(() => {
    function revealFromHash() {
      if (window.location.hash === "#rezervo-termin") {
        revealBooking();
      }
    }
    revealFromHash();
    window.addEventListener("hashchange", revealFromHash);
    return () => window.removeEventListener("hashchange", revealFromHash);
  }, []);
  useEffect(() => {
    if (!bookingOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBookingOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [bookingOpen]);
  const bookingLabel = ({ sq: "Cakto termin", en: "Book appointment", de: "Termin vereinbaren", fr: "Prendre rendez-vous" } as const)[lang];
  const promos = [
    {
      img: p0,
      title: "MANICURE",
      sub: ({ sq: "Zgjedh datën dhe orën që të përshtatet.", en: "Choose the date and time that suits you.", de: "Wähle dein passendes Datum und deine Uhrzeit.", fr: "Choisissez la date et l'heure qui vous conviennent." } as const)[lang],
      btn: ({ sq: "Cakto Termin për MANICURE", en: "Book MANICURE", de: "MANIKÜRE buchen", fr: "Réserver MANUCURE" } as const)[lang],
      href: "#rezervo-termin",
      bookingMode: "manicure" as const,
      photoLeft: true,
      external: false,
    },
    { img: p1, title: tr("promoAcademyTitle"), sub: tr("promoAcademySub"), btn: tr("promoAcademyBtn"), href: whatsappLink(info.academyMessage), bookingMode: undefined, photoLeft: false, external: true },
    { img: p2, title: "PEDICURE", sub: tr("promoFeetSub"), btn: ({ sq: "Cakto Termin për PEDICURE", en: "Book PEDICURE", de: "PEDIKÜRE buchen", fr: "Réserver PÉDICURE" } as const)[lang], href: "#rezervo-termin", bookingMode: "pedicure" as const, photoLeft: true, external: false },
  ];
  const benefits = [
    {
      Icon: Gem,
      title: ({ sq: "Cilësi Premium", en: "Premium Quality", de: "Premium Qualität", fr: "Qualité premium" } as const)[lang],
      sub: ({ sq: "Për profesionistë dhe shtëpi", en: "For professionals & home", de: "Für Profis & Zuhause", fr: "Pour pros et particuliers" } as const)[lang],
    },
    {
      Icon: Truck,
      title: ({ sq: "Dërgesë e shpejtë", en: "Fast Delivery", de: "Schnelle Lieferung", fr: "Livraison rapide" } as const)[lang],
      sub: ({ sq: "Në gjithë Kosovën", en: "Across Kosovo", de: "In ganz Kosovo", fr: "Partout au Kosovo" } as const)[lang],
    },
    {
      Icon: ShieldCheck,
      title: ({ sq: "Pagesë e sigurt", en: "Secure Payment", de: "Sichere Zahlung", fr: "Paiement sécurisé" } as const)[lang],
      sub: ({ sq: "Dhe mbrojtje e të dhënave", en: "& data protection", de: "& Datenschutz", fr: "Et protection des données" } as const)[lang],
    },
    {
      Icon: Headphones,
      title: ({ sq: "Këshillim profesional", en: "Expert Advice", de: "Kompetente Beratung", fr: "Conseils professionnels" } as const)[lang],
      sub: ({ sq: "Dhe trajnime", en: "& training", de: "& Schulung", fr: "Et formations" } as const)[lang],
    },
  ];

  return (
    <div className="bg-background">
      {/* Restore the four service highlights near the foot of the homepage. */}
      <section className="border-y border-neutral-200 bg-white text-[#191517]" aria-label={lang === "sq" ? "Përparësitë tona" : "Our advantages"}>
        <div className="container-app grid grid-cols-2 gap-5 py-7 md:grid-cols-4 md:gap-4">
          {benefits.map(({ Icon, title, sub }) => (
            <div key={title} className="flex min-w-0 items-center gap-3 md:justify-center">
              <Icon className="h-8 w-8 shrink-0 text-[#1c1719]" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold leading-snug sm:text-sm">{title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-neutral-600">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Keep the three existing promotions and their original working destinations. */}
      <section className="bg-[#f8f6f7]">
        <div className="container-app grid gap-3 py-5 md:grid-cols-3">
          {promos.map((p) => (
            <a
              key={p.title}
              href={p.href}
              onClick={p.bookingMode ? (event) => { event.preventDefault(); revealBooking(p.bookingMode); } : undefined}
              target={p.external ? "_blank" : undefined}
              rel={p.external ? "noopener noreferrer" : undefined}
              className="group relative flex min-h-[175px] items-center overflow-hidden rounded-lg bg-[#20191c] text-white sm:min-h-[185px]"
            >
              <img
                src={p.img}
                alt=""
                loading="lazy"
                className={`absolute inset-y-0 h-full w-[62%] object-cover transition-transform duration-500 group-hover:scale-105 ${p.photoLeft ? "left-0" : "right-0"}`}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 ${p.photoLeft ? "bg-gradient-to-l from-[#20191c] via-[#20191c]/95 to-transparent" : "bg-gradient-to-r from-[#20191c] via-[#20191c]/95 to-transparent"}`}
              />
              <div className={`relative z-10 flex w-full px-4 py-5 ${p.photoLeft ? "justify-end text-left" : "justify-start text-left"}`}>
                <div className="w-[57%]">
                  <div className="font-display text-lg leading-tight sm:text-xl">{p.title}</div>
                  <div className="mt-1.5 text-xs leading-snug text-white/85">{p.sub}</div>
                  <span className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#21191d]">
                    {p.btn} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Booking is shown only when requested; no Cakto termin box at the bottom. */}
      {bookingOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-6"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingOpen(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={bookingLabel}
            id="rezervo-termin"
            className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-5 text-foreground shadow-2xl sm:p-8"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl">{bookingLabel}</h2>
              <button
                type="button"
                aria-label={({ sq: "Mbyll", en: "Close", de: "Schließen", fr: "Fermer" } as const)[lang]}
                onClick={() => setBookingOpen(false)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AppointmentBooking embedded mode={bookingMode} />
          </section>
        </div>
      )}
    </div>
  );
}
