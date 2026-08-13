import { Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Butoni pluskues i thirrjes — i dukshëm në çdo faqe të dyqanit (veçanërisht në celular). */
export function CallButton() {
  const { tr, lang } = useI18n();
  const phone = tr("contactPhone");
  const label = lang === "sq" ? "Thirr tani" : "Call now";
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      aria-label={`${label}: ${phone}`}
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[var(--pink-deep)] px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-black/20 transition hover:bg-[var(--pink)] active:scale-95 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3.5 sm:text-sm"
    >
      <Phone className="h-4 w-4" />
      <span className="hidden xs:inline sm:inline">{label}</span>
    </a>
  );
}
