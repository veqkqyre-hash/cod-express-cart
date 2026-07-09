import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { tr } = useI18n();
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/40">
      <div className="container-app py-10 grid gap-6 sm:grid-cols-3 text-sm">
        <div>
          <div className="font-display text-lg mb-2">Dream Studio</div>
          <p className="text-muted-foreground">{tr("tagline")}</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Kontakt</div>
          <p className="text-muted-foreground">{tr("contactPhone")}</p>
          <p className="text-muted-foreground">Prishtinë, Kosovë</p>
        </div>
        <div>
          <div className="font-semibold mb-2">{tr("paymentMethod")}</div>
          <p className="text-muted-foreground">{tr("cod")} — {tr("codDesc")}</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        {tr("footerNote")}
      </div>
    </footer>
  );
}
