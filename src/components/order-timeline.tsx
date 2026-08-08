import { Check, Clock, XCircle } from "lucide-react";

const FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

const LABELS: Record<string, { sq: string; en: string; descSq: string; descEn: string }> = {
  pending: { sq: "Në pritje", en: "Pending", descSq: "Porosia u pranua, presim konfirmimin", descEn: "Order received, awaiting confirmation" },
  confirmed: { sq: "Konfirmuar", en: "Confirmed", descSq: "Porosia u konfirmua me telefon/email", descEn: "Order confirmed with you" },
  processing: { sq: "Në përgatitje", en: "Processing", descSq: "Produktet po paketohen", descEn: "Your items are being packed" },
  shipped: { sq: "Dërguar", en: "Shipped", descSq: "Porosia është në rrugë drejt jush", descEn: "On its way to you" },
  delivered: { sq: "Dorëzuar", en: "Delivered", descSq: "Pagesa bëhet në dorëzim (COD)", descEn: "Payment on delivery (COD)" },
  cancelled: { sq: "Anuluar", en: "Cancelled", descSq: "Porosia është anuluar", descEn: "This order was cancelled" },
};

export function OrderTimeline({
  status,
  createdAt,
  updatedAt,
  lang,
}: {
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  lang: string;
}) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const cancelled = status === "cancelled";
  const currentIndex = cancelled ? -1 : FLOW.indexOf(status as (typeof FLOW)[number]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl">{L("Statusi i porosisë", "Order status")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {L("Ndjek porosinë tuaj hap pas hapi", "Follow your order step by step")}
      </p>

      {cancelled ? (
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-destructive/10 p-4">
          <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <div className="font-medium">{L(LABELS.cancelled.sq, LABELS.cancelled.en)}</div>
            <div className="text-sm text-muted-foreground">{L(LABELS.cancelled.descSq, LABELS.cancelled.descEn)}</div>
            {updatedAt && <div className="mt-1 text-xs text-muted-foreground">{new Date(updatedAt).toLocaleString()}</div>}
          </div>
        </div>
      ) : (
        <ol className="mt-6 space-y-0">
          {FLOW.map((step, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            const meta = LABELS[step];
            const time = i === 0 ? createdAt : active ? updatedAt : null;
            return (
              <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                {i < FLOW.length - 1 && (
                  <span
                    className={`absolute left-[15px] top-8 h-full w-0.5 ${done ? "bg-primary" : "bg-border"}`}
                    aria-hidden
                  />
                )}
                <span
                  className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                        ? "border-primary bg-background text-primary"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : active ? <Clock className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                </span>
                <div className="min-w-0 pt-1">
                  <div className={`text-sm font-medium ${done || active ? "" : "text-muted-foreground"}`}>
                    {L(meta.sq, meta.en)}
                    {active && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {L("Aktual", "Current")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{L(meta.descSq, meta.descEn)}</div>
                  {time && <div className="mt-1 text-[11px] text-muted-foreground">{new Date(time).toLocaleString()}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
