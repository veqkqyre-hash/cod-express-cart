import { MessageCircle, Phone, Copy } from "lucide-react";
import { toast } from "sonner";
import { logAction } from "@/lib/audit";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  total: number;
  status: string;
};

const TEXT: Record<string, { sq: (o: Order) => string; en: (o: Order) => string }> = {
  pending: {
    sq: (o) => `Përshëndetje ${o.customer_name}! Porosia ${o.order_number} (${Number(o.total).toFixed(2)} €) u pranua në Dreame Beauty Cosmetics L.L.C. Ju kontaktojmë për konfirmim. Pagesa bëhet në dorëzim.`,
    en: (o) => `Hello ${o.customer_name}! Order ${o.order_number} (${Number(o.total).toFixed(2)} €) was received at Dreame Beauty Cosmetics L.L.C. We'll confirm shortly. Payment on delivery.`,
  },
  confirmed: {
    sq: (o) => `Përshëndetje ${o.customer_name}! Porosia ${o.order_number} u konfirmua. Totali ${Number(o.total).toFixed(2)} € paguhet me para në dorë kur ta merrni. Faleminderit — Dreame Beauty Cosmetics L.L.C.`,
    en: (o) => `Hello ${o.customer_name}! Order ${o.order_number} is confirmed. Total ${Number(o.total).toFixed(2)} € payable in cash on delivery. Thank you — Dreame Beauty Cosmetics L.L.C.`,
  },
  processing: {
    sq: (o) => `Përshëndetje ${o.customer_name}! Porosia ${o.order_number} është në përgatitje dhe dërgohet së shpejti. — Dreame Beauty Cosmetics L.L.C.`,
    en: (o) => `Hello ${o.customer_name}! Order ${o.order_number} is being prepared and ships soon. — Dreame Beauty Cosmetics L.L.C.`,
  },
  shipped: {
    sq: (o) => `Përshëndetje ${o.customer_name}! Porosia ${o.order_number} është dërguar drejt ${o.city}. Përgatitni ${Number(o.total).toFixed(2)} € për pagesë në dorëzim. — Dreame Beauty Cosmetics L.L.C.`,
    en: (o) => `Hello ${o.customer_name}! Order ${o.order_number} has shipped to ${o.city}. Please have ${Number(o.total).toFixed(2)} € ready for cash on delivery. — Dreame Beauty Cosmetics L.L.C.`,
  },
  delivered: {
    sq: (o) => `Faleminderit ${o.customer_name}! Porosia ${o.order_number} u dorëzua. Shpresojmë të kënaqeni — Dreame Beauty Cosmetics L.L.C.`,
    en: (o) => `Thank you ${o.customer_name}! Order ${o.order_number} was delivered. Hope you love it — Dreame Beauty Cosmetics L.L.C.`,
  },
  cancelled: {
    sq: (o) => `Përshëndetje ${o.customer_name}. Porosia ${o.order_number} është anuluar. Për çdo pyetje jemi në dispozicion. — Dreame Beauty Cosmetics L.L.C.`,
    en: (o) => `Hello ${o.customer_name}. Order ${o.order_number} has been cancelled. Contact us for any questions. — Dreame Beauty Cosmetics L.L.C.`,
  },
};

function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `383${digits.slice(1)}`; // Kosovo default
  return digits;
}

/** One-click WhatsApp / Viber status message for the customer (COD). */
export function CustomerMessage({ order, lang }: { order: Order; lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const build = TEXT[order.status] ?? TEXT.pending;
  const message = lang === "sq" ? build.sq(order) : build.en(order);
  const phone = normalizePhone(order.phone);

  function open(kind: "wa" | "viber") {
    const url =
      kind === "wa"
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `viber://chat?number=%2B${phone}`;
    if (kind === "viber") {
      navigator.clipboard?.writeText(message).catch(() => {});
      toast.success(L("Teksti u kopjua — hapet Viber", "Text copied — opening Viber"));
    }
    window.open(url, "_blank", "noopener");
    logAction(`notify.${kind}`, "orders", order.id, { order_number: order.order_number, status: order.status });
  }

  const btn = "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted";

  return (
    <div className="mt-4 rounded-xl border border-border p-4 no-print">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {L("Njofto klientin për statusin", "Notify customer about status")}
      </div>
      <p className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => open("wa")} className={`${btn} bg-green-600 text-white border-green-600 hover:bg-green-700`}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </button>
        <button onClick={() => open("viber")} className={btn}>
          <Phone className="h-4 w-4" /> Viber
        </button>
        <button
          onClick={() => { navigator.clipboard?.writeText(message); toast.success(L("U kopjua", "Copied")); }}
          className={btn}
        >
          <Copy className="h-4 w-4" /> {L("Kopjo tekstin", "Copy text")}
        </button>
      </div>
    </div>
  );
}
