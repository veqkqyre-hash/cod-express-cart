import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cashierDisplay } from "@/lib/cashier";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { Printer, X, Undo2 } from "lucide-react";
import { printReceipt } from "@/lib/pos-receipt";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { Panel, Empty } from "@/components/admin-ui";
import { loadBusinessInfo } from "@/lib/store-info";
import { toast } from "sonner";


type Sale = {
  id: string;
  sale_number: string;
  total: number;
  cost_total: number;
  item_count: number;
  payment_method: string;
  paid_amount: number | null;
  change_amount: number | null;
  cashier_email: string | null;
  discount: number | null;
  customer_name: string | null;
  created_at: string;
};

type Item = {
  id: string;
  product_name: string;
  barcode: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export function PosSalesPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [open, setOpen] = useState<Sale | null>(null);
  useEffect(() => {
    void loadBusinessInfo();
  }, []);


  const { data: sales } = useQuery({
    queryKey: ["pos-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_sales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Sale[];
    },
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rows = (sales ?? []).filter((s) => {
    const d = s.created_at.slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
  });
  const columns: Column<Sale>[] = [
    { key: "sale_number", label: L("Nr.", "No."), get: (s) => s.sale_number },
    { key: "date", label: L("Data", "Date"), get: (s) => new Date(s.created_at).toLocaleString() },
    { key: "items", label: L("Artikuj", "Items"), get: (s) => s.item_count },
    { key: "subtotal", label: L("Nëntotali", "Subtotal"), get: (s) => (Number(s.total) + Number(s.discount ?? 0)).toFixed(2) },
    { key: "discount", label: L("Zbritja", "Discount"), get: (s) => Number(s.discount ?? 0).toFixed(2) },
    { key: "total", label: L("Totali", "Total"), get: (s) => Number(s.total).toFixed(2) },
    { key: "cost", label: L("Kosto", "Cost"), get: (s) => Number(s.cost_total ?? 0).toFixed(2) },
    { key: "profit", label: L("Fitimi", "Profit"), get: (s) => (Number(s.total) - Number(s.cost_total ?? 0)).toFixed(2) },
    { key: "customer", label: L("Klienti", "Customer"), get: (s) => s.customer_name ?? "" },
    { key: "method", label: L("Pagesa", "Payment"), get: (s) => s.payment_method },
    { key: "cashier", label: L("Përdoruesi", "User"), get: (s) => cashierDisplay(s.cashier_email) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <label className="flex items-center gap-1">{L("Nga", "From")}<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border px-2 py-1" /></label>
          <label className="flex items-center gap-1">{L("Deri", "To")}<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border px-2 py-1" /></label>
          <span>{rows.length} {L("shitje", "sales")} · {formatEur(rows.reduce((s, r) => s + Number(r.total), 0))} · {L("fitimi", "profit")} {formatEur(rows.reduce((s, r) => s + Number(r.total) - Number(r.cost_total ?? 0), 0))}</span>
        </div>
        <ExportButtons
          filename={`pos-shitjet${from ? "-" + from : ""}${to ? "_" + to : ""}`}
          title={L("Historia e shitjeve", "Sales history")}
          columns={columns}
          rows={rows}
          entity="pos_sales"
          labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka shitje", "No sales") }}
        />
      </div>

      <Panel>
        {rows.length === 0 ? (
          <Empty label={L("Nuk ka shitje të regjistruara.", "No sales recorded yet.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{L("Nr. shitjes", "Sale no.")}</th>
                  <th className="px-4 py-3">{L("Data & ora", "Date & time")}</th>
                  <th className="px-4 py-3">{L("Artikuj", "Items")}</th>
                  <th className="px-4 py-3">{L("Totali", "Total")}</th>
                  <th className="px-4 py-3">{L("Pagesa", "Payment")}</th>
                  <th className="px-4 py-3">{L("Përdoruesi", "User")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} onClick={() => setOpen(s)} className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono font-medium">{s.sale_number}</td>
                    <td className="px-4 py-3">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{s.item_count}</td>
                    <td className="px-4 py-3 font-semibold">{formatEur(Number(s.total))}</td>
                    <td className="px-4 py-3 capitalize">{s.payment_method}</td>
                    <td className="px-4 py-3 text-neutral-500">{cashierDisplay(s.cashier_email)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {open && <SaleModal sale={open} onClose={() => setOpen(null)} L={L} />}
    </div>
  );
}

function SaleModal({ sale, onClose, L }: { sale: Sale; onClose: () => void; L: (sq: string, en: string) => string }) {
  const qc = useQueryClient();
  const [refunding, setRefunding] = useState(false);
  const { data: items } = useQuery({
    queryKey: ["pos-sale-items", sale.id],
    queryFn: async () => {
      const { data } = await supabase.from("pos_sale_items").select("*").eq("sale_id", sale.id);
      return (data ?? []) as unknown as Item[];
    },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="font-display text-xl">{sale.sale_number}</h2>
            <div className="text-xs text-neutral-500">{new Date(sale.created_at).toLocaleString()}</div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <tbody>
              {(items ?? []).map((i) => (
                <tr key={i.id} className="border-b border-neutral-100">
                  <td className="py-2">
                    {i.product_name}
                    {i.barcode && <div className="text-xs text-neutral-400">{i.barcode}</div>}
                  </td>
                  <td className="py-2 text-neutral-500">
                    {i.quantity} × {formatEur(Number(i.unit_price))}
                  </td>
                  <td className="py-2 text-right font-medium">{formatEur(Number(i.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-1 text-sm">
            {sale.discount != null && Number(sale.discount) > 0 && (
              <>
                <Row label={L("Nëntotali", "Subtotal")} value={formatEur(Number(sale.total) + Number(sale.discount))} />
                <Row label={L("Zbritja", "Discount")} value={`-${formatEur(Number(sale.discount))}`} />
              </>
            )}
            <Row label="TOTAL" value={formatEur(Number(sale.total))} bold />
            <Row label={L("Pagesa", "Payment")} value={sale.payment_method} />
            {sale.customer_name && <Row label={L("Klienti", "Customer")} value={sale.customer_name} />}
            {sale.paid_amount != null && <Row label={L("Paguar", "Paid")} value={formatEur(Number(sale.paid_amount))} />}
            {sale.change_amount != null && <Row label={L("Kusuri", "Change")} value={formatEur(Number(sale.change_amount))} />}
            <Row label={L("Përdoruesi", "User")} value={cashierDisplay(sale.cashier_email)} />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() =>
                printReceipt(
                  sale,
                  (items ?? []).map((i) => ({ name: i.product_name, qty: i.quantity, price: Number(i.unit_price) })),
                  80,
                )
              }
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <Printer className="h-4 w-4" /> {L("PRINT FATURË", "PRINT RECEIPT")}
            </button>
            <button
              onClick={() =>
                printReceipt(
                  sale,
                  (items ?? []).map((i) => ({ name: i.product_name, qty: i.quantity, price: Number(i.unit_price) })),
                  58,
                )
              }
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm"
            >
              58mm
            </button>
            <button
              disabled={refunding}
              onClick={async () => {
                const reason = prompt(L("Arsyeja e kthimit (opsionale):", "Refund reason (optional):"));
                if (reason === null) return;
                setRefunding(true);
                const { error } = await supabase.rpc("refund_pos_sale", {
                  _sale_id: sale.id,
                  _reason: reason.trim() || undefined,
                });
                setRefunding(false);
                if (error) return toast.error(error.message);
                toast.success(L("Kthimi u regjistrua, stoku u kthye.", "Refund saved, stock restored."));
                qc.invalidateQueries({ queryKey: ["pos-refunds"] });
                qc.invalidateQueries({ queryKey: ["products"] });
                onClose();
              }}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" /> {L("KTHIM", "REFUND")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : ""}`}>
      <span className={bold ? "" : "text-neutral-500"}>{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  );
}
