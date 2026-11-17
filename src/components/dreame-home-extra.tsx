import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { whatsappLink } from "@/lib/business-whatsapp";
import p0 from "@/assets/dreame-home/promo-0-photo.jpg";
import p1 from "@/assets/dreame-home/promo-1-photo.jpg";
import p2 from "@/assets/dreame-home/promo-2-photo.jpg";
import c0 from "@/assets/dreame-home/cat-0.jpg";
import c1 from "@/assets/dreame-home/cat-1.jpg";
import c2 from "@/assets/dreame-home/cat-2.jpg";
import c3 from "@/assets/dreame-home/cat-3.jpg";
import c4 from "@/assets/dreame-home/cat-4.jpg";
import c5 from "@/assets/dreame-home/cat-5.jpg";

const CATS = [
  { img: c0, label: "Nail Care", slug: "nail-art" },
  { img: c1, label: "Gel Polish", slug: "llak-gel" },
  { img: c2, label: "Builder Gel", slug: "builder-gel" },
  { img: c3, label: "Tools & Accessories", slug: "lime-instrumente" },
  { img: c4, label: "Foot Care", slug: "pedikyr" },
  { img: c5, label: "Cleaner & Acetone", slug: "baze-top-coat" },
];

export function DreameHomeExtra() {
  return (
    <div className="bg-background">
      {/* Categories */}
      <section className="container-app pt-12 pb-8">
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
    academyMessage: "Përshëndetje, dua të regjistrohem në DREAMÈ Beauty Academy.\\nEmri dhe mbiemri: ____\\nTelefoni: ____\\nTrajnimi që më intereson: ____\\nJu lutem më dërgoni informata për trajnimet.",
  },
  en: {
    studioTitle: "Professional nail studio supplies",
    studioBody: "Explore gel polish, builder gel, base and top coats, nail drills, UV/LED lamps, tools and accessories for professional use. Contact us about studio supplies and quantities.",
    studioAction: "Explore products",
    feetTitle: "Foot care and pedicure",
    feetBody: "Products and accessories for pedicure, hygiene and foot care. For a treatment appointment, send your preferred date and time.",
    feetAction: "Request pedicure appointment",
    academyMessage: "Hello, I would like to register for DREAMÈ Beauty Academy.\\nFull name: ____\\nPhone: ____\\nTraining of interest: ____\\nPlease send me information about courses.",
  },
  de: {
    studioTitle: "Professioneller Nagelstudio-Bedarf",
    studioBody: "Entdecken Sie Gel-Lack, Aufbaugel, Base und Top Coat, Nagelfräser, UV/LED-Lampen, Werkzeuge und Zubehör. Kontaktieren Sie uns für Studio-Bestellungen.",
    studioAction: "Produkte ansehen",
    feetTitle: "Fußpflege und Pediküre",
    feetBody: "Produkte und Zubehör für Pediküre, Hygiene und Fußpflege. Für einen Behandlungstermin senden Sie uns Ihren Wunschtermin.",
    feetAction: "Pediküre-Termin anfragen",
    academyMessage: "Hallo, ich möchte mich bei DREAMÈ Beauty Academy anmelden.\\nName: ____\\nTelefon: ____\\nGewünschte Schulung: ____\\nBitte senden Sie mir Informationen.",
  },
  fr: {
    studioTitle: "Fournitures professionnelles pour salons d'ongles",
    studioBody: "Découvrez vernis gel, gel de construction, base et top coat, ponceuses, lampes UV/LED, outils et accessoires professionnels. Contactez-nous pour les commandes de salon.",
    studioAction: "Voir les produits",
    feetTitle: "Soins des pieds et pédicure",
    feetBody: "Produits et accessoires pour pédicure, hygiène et soins des pieds. Pour un rendez-vous, envoyez-nous vos préférences de date et d'heure.",
    feetAction: "Demander un rendez-vous pédicure",
    academyMessage: "Bonjour, je souhaite m'inscrire à DREAMÈ Beauty Academy.\\nNom: ____\\nTéléphone: ____\\nFormation souhaitée: ____\\nMerci de m'envoyer des informations.",
  },
} as const;

export function DreameHomePromos() {
  const { tr, lang } = useI18n();
  const info = PROMO_INFO[lang];
  const promos = [
    { img: p0, title: tr("promoStudiosTitle"), sub: tr("promoStudiosSub"), btn: tr("promoLearnMore"), href: "#studio-info", photoLeft: true, external: false },
    { img: p1, title: tr("promoAcademyTitle"), sub: tr("promoAcademySub"), btn: tr("promoAcademyBtn"), href: whatsappLink(info.academyMessage), photoLeft: false, external: true },
    { img: p2, title: tr("promoFeetTitle"), sub: tr("promoFeetSub"), btn: tr("promoLearnMore"), href: "#feet-info", photoLeft: true, external: false },
  ];
  return (
    <div className="bg-background">
      {/* Existing promotional cards: images, titles and layout remain unchanged. */}
      <section className="container-app pb-12">
        <div className="grid gap-3 md:grid-cols-3">
          {promos.map((p) => (
            <a key={p.title} href={p.href} target={p.external ? "_blank" : undefined} rel={p.external ? "noopener noreferrer" : undefined} className="group flex overflow-hidden rounded-xl bg-foreground text-background">
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
            <Link to="/shop" search={{}} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--pink-deep)] hover:underline">
              {info.studioAction} <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
          <article id="feet-info" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 text-foreground">
            <h3 className="font-display text-xl">{info.feetTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{info.feetBody}</p>
            <a href="/#rezervo-termin" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--pink-deep)] hover:underline">
              {info.feetAction} <ArrowRight className="h-4 w-4" />
            </a>
          </article>
        </div>
      </section>
    </div>
  );
}
