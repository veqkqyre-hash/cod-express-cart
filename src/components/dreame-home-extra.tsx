import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
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
export function DreameHomePromos() {
  const { tr } = useI18n();
  const promos = [
    { img: p0, title: tr("promoStudiosTitle"), sub: tr("promoStudiosSub"), btn: tr("promoLearnMore"), to: "/shop", photoLeft: true },
    { img: p1, title: tr("promoAcademyTitle"), sub: tr("promoAcademySub"), btn: tr("promoAcademyBtn"), to: "/contact", photoLeft: false },
    { img: p2, title: tr("promoFeetTitle"), sub: tr("promoFeetSub"), btn: tr("promoLearnMore"), to: "/shop", photoLeft: true },
  ];
  return (
    <div className="bg-background">
      {/* Promo banners */}
      <section className="container-app pb-12">
        <div className="grid gap-3 md:grid-cols-3">
          {promos.map((p) => (
            <Link key={p.title} to={p.to} className="group flex overflow-hidden rounded-xl bg-foreground text-background">
              {p.photoLeft && <img src={p.img} alt="" loading="lazy" className="w-24 shrink-0 object-cover sm:w-28" />}
              <div className="flex flex-1 flex-col justify-center gap-1.5 p-4">
                <div className="font-display text-lg leading-tight">{p.title}</div>
                <div className="text-xs opacity-80">{p.sub}</div>
                <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-background px-4 py-1.5 text-xs font-semibold text-foreground">
                  {p.btn} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              {!p.photoLeft && <img src={p.img} alt="" loading="lazy" className="w-24 shrink-0 object-cover sm:w-28" />}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
