import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, CreditCard, Truck, ShieldCheck, Headphones } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { tr, lang } = useI18n();
  return (
    <footer className="mt-24">
      {/* Trust strip */}
      <div className="border-y border-border bg-[var(--pink-soft)]/40">
        <div className="container-app grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { icon: Truck, title: tr("freeShippingTitle"), sub: tr("freeShippingSub") },
            { icon: ShieldCheck, title: tr("codTitle"), sub: tr("codSub") },
            { icon: Headphones, title: tr("supportTitle"), sub: tr("supportSub") },
            { icon: CreditCard, title: tr("securePayTitle"), sub: tr("securePaySub") },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-soft">
                <f.icon className="h-5 w-5 text-[var(--pink-deep)]" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black text-white">
        <div className="container-app grid gap-10 py-16 md:grid-cols-12">
          <div className="md:col-span-4 space-y-5">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--pink-deep)] text-white font-display text-lg">D</span>
              <span className="font-display text-3xl tracking-tight">Dreame Beauty Cosmetics L.L.C.</span>
            </Link>
            <p className="text-sm text-white/70 max-w-xs">
              {lang === "sq"
                ? "Furnizim luksoz e profesional për sallone bukurie. Bukuri e dorëzuar në derën tuaj."
                : "Luxury professional supplies for beauty salons. Beauty delivered to your door."}
            </p>
            <div className="flex gap-2">
              {[Instagram, Facebook, Youtube].map((I, i) => (
                <a key={i} href="#" aria-label="social" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-[var(--pink)] hover:bg-[var(--pink-deep)] transition">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pink)]">{tr("shop")}</div>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/shop" className="hover:text-white transition">{tr("allProducts")}</Link></li>
              <li><Link to="/shop" search={{ category: "hair-care" }} className="hover:text-white transition">Hair Care</Link></li>
              <li><Link to="/shop" search={{ category: "makeup" }} className="hover:text-white transition">Makeup</Link></li>
              <li><Link to="/shop" search={{ category: "nails" }} className="hover:text-white transition">Nails</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition">{tr("wishlist")}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pink)]">{tr("help")}</div>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/account" className="hover:text-white transition">{tr("account")}</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">{tr("cart")}</Link></li>
              <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">{tr("contact")}</Link></li>
              <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition">{tr("shippingPolicy")}</Link></li>
              <li><Link to="/returns" className="hover:text-white transition">{tr("returns")}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pink)]">{tr("contact")}</div>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 text-[var(--pink)] shrink-0" /> Rr. Nëna Terezë, Fushë Kosovë 12000, Kosovë</li>
              <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-[var(--pink)] shrink-0" /> +383 44 123 456</li>
              <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-[var(--pink)] shrink-0" /> hello@dreamstudio-ks.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-app flex flex-col gap-3 py-5 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Dreame Beauty Cosmetics L.L.C. {lang === "sq" ? "Të gjitha të drejtat e rezervuara." : "All rights reserved."}</div>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-white transition">{lang === "sq" ? "Privatësia" : "Privacy"}</Link>
              <Link to="/terms" className="hover:text-white transition">{lang === "sq" ? "Kushtet" : "Terms"}</Link>
              <span className="opacity-70">{tr("cod")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
