import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { cashierDisplay } from "@/lib/cashier";
import { Panel, Empty, Modal } from "@/components/admin-ui";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";

type Refund = {
  id: string;
  refund_number: string;
  sale_number: string | null;
  total: number;
  item_count: number;
  reason: string | null;
  cashier_email: string | null;
  created_at: string;
};

export function RefundsPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [newOpen, setNewOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["pos-refunds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pos_refunds").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as Refund[];
    },
  });

  const rows = data ?? [];
  const columns: Column<Refund>[] = [
    { key: "refund_number", label: L("Nr. kthimit", "Refund no."), get: (r) => r.refund_number },
    { key: "sale_number", label: L("Nr. shitjes", "Sale no."), get: (r) => r.sale_number ?? "" },
    { key: "items", label: L("Artikuj", "Items"), get: (r) => r.item_count },
    { key: "total", label: L("Totali", "Total"), get: (r) => Number(r.total).toFixed(2) },
    { key: "reason", label: L("Arsyeja", "Reason"), get: (r) => r.reason ?? "" },
    { key: "date", label: L("Data", "Date"), get: (r) => new Date(r.created_at).toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-neutral-600">
          {rows.length} {L("kthime", "refunds")} · {formatEur(rows.reduce((s, r) => s + Number(r.total), 0))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[var(--pink-deep,#e91e63)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Undo2 className="h-4 w-4" /> {L("Kthim i re", "New refund")}
          </button>
          <ExportButtons filename="kthimet" title={L("Kthimet", "Refunds")} columns={columns} rows={rows} entity="pos_refunds" labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka kthime", "No refunds") }} />
        </div>
      </div>

      <Panel>
        {rows.length === 0 ? (
          <Empty label={L("Nuk ka kthime të regjistruara.", "No refunds recorded.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{L("Nr. kthimit", "Refund no.")}</th>
                  <th className="px-4 py-3">{L("Shitja", "Sale")}</th>
                  <th className="px-4 py-3">{L("Artikuj", "Items")}</th>
                  <th className="px-4 py-3">{L("Totali", "Total")}</th>
                  <th className="px-4 py-3">{L("Arsyeja", "Reason")}</th>
                  <th className="px-4 py-3">{L("Përdoruesi", "User")}</th>
                  <th className="px-4 py-3">{L("Data", "Date")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-mono font-medium">{r.refund_number}</td>
                    <td className="px-4 py-3 font-mono text-neutral-500">{r.sale_number}</td>
                    <td className="px-4 py-3">{r.item_count}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">-{formatEur(Number(r.total))}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.reason}</td>
                    <td className="px-4 py-3 text-neutral-500">{cashierDisplay(r.cashier_email)}</td>
                    <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {newOpen && <NewRefundModal onClose={() => setNewOpen(false)} L={L} />}
    </div>
  );
}

function NewRefundModal({ onClose, L }: { onClose: () => void; L: (sq: string, en: string) => string }) {
  const qc = useQueryClient();
  const [saleNumber, setSaleNumber] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data: sale, error: findErr } = await supabase
      .from("pos_sales")
      .select("id")
      .eq("sale_number", saleNumber.trim().toUpperCase())
      .maybeSingle();
    if (findErr || !sale) {
      setBusy(false);
      return toast.error(L("Shitja nuk u gjet.", "Sale not found."));
    }
    const { error } = await supabase.rpc("refund_pos_sale", {
      _sale_id: sale.id,
      _reason: reason.trim() || undefined,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(L("Kthimi u regjistrua, stoku u kthye.", "Refund saved, stock restored."));
    qc.invalidateQueries({ queryKey: ["pos-refunds"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    onClose();
  }

  return (
    <Modal title={L("Kthim i mallit", "Product return")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{L("Numri i shitjes", "Sale number")} *</label>
          <input required value={saleNumber} onChange={(e) => setSaleNumber(e.target.value)} placeholder="POS-12" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-mono" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{L("Arsyeja", "Reason")}</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        </div>
        <p className="text-xs text-neutral-500">
          {L("Kthehen të gjithë artikujt e shitjes dhe stoku shtohet automatikisht.", "All items of the sale are returned and stock is restored automatically.")}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2 text-sm">{L("Anulo", "Cancel")}</button>
          <button disabled={busy} className="rounded-full bg-[var(--pink-deep,#e91e63)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "…" : L("Regjistro kthimin", "Save refund")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
