import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { metaFor } from "@/components/info-page";
import { ChevronDown, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  component: Faq,
  head: () => metaFor("/faq", "Pyetje të shpeshta", "Përgjigje për porositë, pagesën në dorëzim (COD), transportin dhe kthimet — Dream Studio."),
});

const QA = [
  {
    sq: ["Si funksionon pagesa në dorëzim (COD)?", "Porositni online pa paguar asgjë paraprakisht. Paguani me para në dorë kuririn kur produkti arrin në adresën tuaj."],
    en: ["How does Cash on Delivery work?", "Order online without paying upfront. You pay the courier in cash when the parcel arrives at your address."],
  },
  {
    sq: ["Sa kohë zgjat dërgesa?", "Brenda Prishtinës 1 ditë pune, në qytetet e tjera të Kosovës 1–2 ditë pune."],
    en: ["How long does delivery take?", "1 working day within Prishtina and 1–2 working days elsewhere in Kosovo."],
  },
  {
    sq: ["Sa është çmimi i transportit?", "Transporti është falas për porosi mbi 50€. Nën këtë vlerë aplikohet tarifa e zonës suaj, e cila shfaqet gjatë përfundimit të porosisë."],
    en: ["What does shipping cost?", "Shipping is free over €50. Below that, your zone fee applies and is shown at checkout."],
  },
  {
    sq: ["A mund të anuloj porosinë?", "Po. Kontaktoni në +383 44 123 456 ose në WhatsApp para se porosia të dërgohet."],
    en: ["Can I cancel my order?", "Yes. Call +383 44 123 456 or message us on WhatsApp before the order ships."],
  },
  {
    sq: ["Si e ndjek statusin e porosisë?", "Në faqen e konfirmimit të porosisë shfaqet një timeline me statusin aktual. Të njëjtën gjë e shihni edhe në 'Porositë e Mia'."],
    en: ["How do I track my order?", "The order confirmation page shows a status timeline. You can also see it under 'My Orders'."],
  },
  {
    sq: ["A janë produktet origjinale?", "Të gjitha produktet janë 100% origjinale, të furnizuara nga distributorë të autorizuar."],
    en: ["Are the products authentic?", "All products are 100% authentic, sourced from authorized distributors."],
  },
  {
    sq: ["Ofroni çmime për sallone?", "Po. Për blerje me shumicë shkruani në hello@dreamstudio-ks.com për ofertë të personalizuar."],
    en: ["Do you offer salon pricing?", "Yes. For wholesale orders email hello@dreamstudio-ks.com for a custom quote."],
  },
];

function Faq() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--pink-deep)]">
          <HelpCircle className="h-3.5 w-3.5" /> FAQ
        </span>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{L("Pyetje të shpeshta", "Frequently asked questions")}</h1>

        <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {QA.map((item, i) => {
            const [q, a] = lang === "sq" ? item.sq : item.en;
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-medium hover:bg-muted/50"
                  aria-expanded={isOpen}
                >
                  {q}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
