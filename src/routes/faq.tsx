import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { metaFor } from "@/components/info-page";
import { useInfoPage, INFO_DEFAULTS } from "@/lib/info-content";
import { ChevronDown, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  component: Faq,
  head: () => metaFor("/faq", INFO_DEFAULTS.faq.title_sq, INFO_DEFAULTS.faq.meta_sq),
});

function Faq() {
  const { lang } = useI18n();
  const page = useInfoPage("faq");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--pink-deep)]">
          <HelpCircle className="h-3.5 w-3.5" /> FAQ
        </span>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{lang === "sq" ? page.title_sq : page.title_en}</h1>
        {(lang === "sq" ? page.intro_sq : page.intro_en) && (
          <p className="mt-3 text-muted-foreground">{lang === "sq" ? page.intro_sq : page.intro_en}</p>
        )}

        <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {page.blocks.map((item, i) => {
            const q = lang === "sq" ? item.h_sq : item.h_en;
            const a = lang === "sq" ? item.b_sq : item.b_en;
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
                {isOpen && <div className="whitespace-pre-line px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
