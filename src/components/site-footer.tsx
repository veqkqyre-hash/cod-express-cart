import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fallback keeps the existing official Instagram link working until Admin
// settings have been saved and loaded on this visitor's device.
const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/dreamebeautycosmetics/";

// Public customer-contact number; separate from any staff booking number.
const CUSTOMER_PHONE = "+38344208883";
const CUSTOMER_PHONE_DISPLAY = "+383 44 208 883";
const CUSTOMER_WHATSAPP = "https://wa.me/38344208883";

function instagramProfileUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_INSTAGRAM_URL;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:" && (url.hostname === "instagram.com" || url.hostname === "www.instagram.com")) {
      return url.href;
    }
  } catch {
    // Invalid links must never turn into broken or unsafe links.
  }
  return DEFAULT_INSTAGRAM_URL;
}

export function SiteFooter() {
  const { tr, lang } = useI18n();
  const { data: socialSettings } = useQuery({
    queryKey: ["footer-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings")
        .select("value").eq("key", "store").maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as { instagram?: string; facebook?: string };
    },
    staleTime: 60_000,
  });
  const instagramUrl = instagramProfileUrl(socialSettings?.instagram);
  return (
    <footer className="mt-24">
      <div className="bg-black text-white">
        <div className="container-app grid gap-10 py-16 md:grid-cols-12">
          <div className="md:col-span-4 space-y-5">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-11 w-11 shrink-0 place-items-center">
                <img
                  src="/assets/dreame-symbol.svg"
                  alt=""
                  aria-hidden="true"
                  width={32}
                  height={38}
                  className="h-[38px] w-8 object-contain brightness-0 invert"
                />
              </span>
              <span className="font-display text-3xl tracking-tight">Dreame Beauty Cosmetics</span>
            </Link>
            <p className="text-sm text-white/70 max-w-xs">
              {lang === "sq"
                ? "Furnizime profesionale për thonj — shumicë dhe pakicë. Dorëzim në derën tuaj."
                : "Professional nail supplies — wholesale and retail. Delivered to your door."}
            </p>

            <div className="flex gap-2">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href={i === 0 ? instagramUrl : "#"}
                  aria-label={["Instagram", "Facebook", "YouTube"][i]}
                  target={i === 0 ? "_blank" : undefined}
                  rel={i === 0 ? "noopener noreferrer" : undefined}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-[var(--pink)] hover:bg-[var(--pink-deep)] transition"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pink)]">{tr("shop")}</div>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/shop" className="hover:text-white transition">{tr("allProducts")}</Link></li>
              <li><Link to="/shop" search={{ category: "gel-lak" }} className="hover:text-white transition">{lang === "sq" ? "Gel Lak" : "Gel Polish"}</Link></li>
              <li><Link to="/shop" search={{ category: "freza-aparate" }} className="hover:text-white transition">{lang === "sq" ? "Freza & Aparate" : "Drills & Machines"}</Link></li>
              <li><Link to="/shop" search={{ category: "pedikyr" }} className="hover:text-white transition">{lang === "sq" ? "Pedikyr" : "Pedicure"}</Link></li>

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
              <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-[var(--pink)] shrink-0" /> info@dreamebeautycosmetics.com</li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[var(--pink)]" />
                <a href={`tel:${CUSTOMER_PHONE}`} className="hover:text-white hover:underline">
                  {CUSTOMER_PHONE_DISPLAY}
                </a>
              </li>
            </ul>
            <div className="mt-6"><NewsletterSignup dark /></div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-app flex flex-col gap-3 py-5 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/dreame-symbol.svg"
                alt=""
                aria-hidden="true"
                width={25}
                height={25}
                className="h-6 w-6 shrink-0 object-contain brightness-0 invert"
              />
              <span>© {new Date().getFullYear()} Dreame Beauty Cosmetics {lang === "sq" ? "Të gjitha të drejtat e rezervuara." : "All rights reserved."}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-white transition">{lang === "sq" ? "Privatësia" : "Privacy"}</Link>
              <Link to="/terms" className="hover:text-white transition">{lang === "sq" ? "Kushtet" : "Terms"}</Link>
              <span className="opacity-70">{tr("cod")}</span>
            </div>
          </div>
        </div>
      </div>
      <a
        href={CUSTOMER_WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={lang === "sq" ? "Na kontakto në WhatsApp" : "Contact us on WhatsApp"}
        title={lang === "sq" ? "Na shkruaj në WhatsApp" : "Chat on WhatsApp"}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[#25D366] text-white shadow-[0_6px_22px_rgba(0,0,0,0.30)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:bottom-6 sm:right-6"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="h-8 w-8">
          <path d="M20.52 3.48A11.92 11.92 0 0 0 12.06 0C5.5 0 .15 5.35 .15 11.93c0 2.1.55 4.15 1.59 5.97L.05 24l6.24-1.64a11.9 11.9 0 0 0 5.77 1.47h.01c6.57 0 11.92-5.35 11.92-11.93a11.83 11.83 0 0 0-3.47-8.42zM12.06 21.8c-1.81 0-3.59-.49-5.13-1.4l-.37-.22-3.7.97.99-3.6-.24-.38a9.88 9.88 0 0 1-1.52-5.24c0-5.47 4.45-9.92 9.93-9.92a9.87 9.87 0 0 1 7.01 2.91 9.87 9.87 0 0 1 2.9 7.02c0 5.47-4.45 9.92-9.87 9.92zm5.44-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.23-.64.08-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.57-.48-.49-.67-.5h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.49 1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
        </svg>
      </a>
    </footer>
  );
}
