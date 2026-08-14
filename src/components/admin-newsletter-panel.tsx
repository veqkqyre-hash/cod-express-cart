import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Panel, Empty } from "@/components/admin-ui";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { logAction } from "@/lib/audit";

type Sub = { id: string; email: string; lang: string; active: boolean; created_at: string };
type Alert = { id: string; email: string; product_name: string | null; notified: boolean; created_at: string };

export function NewsletterPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"subs" | "alerts">("subs");

  const { data: subs } = useQuery({
    queryKey: ["newsletter-subs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Sub[];
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_alerts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Alert[];
    },
  });

  const subRows = subs ?? [];
  const alertRows = alerts ?? [];

  const subCols: Column<Sub>[] = [
    { key: "email", label: "Email", get: (s) => s.email },
    { key: "lang", label: L("Gjuha", "Language"), get: (s) => s.lang },
    { key: "date", label: L("Data", "Date"), get: (s) => new Date(s.created_at).toLocaleString() },
  ];
  const alertCols: Column<Alert>[] = [
    { key: "email", label: "Email", get: (a) => a.email },
    { key: "product", label: L("Produkti", "Product"), get: (a) => a.product_name ?? "" },
    { key: "notified", label: L("Njoftuar", "Notified"), get: (a) => (a.notified ? "yes" : "no") },
    { key: "date", label: L("Data", "Date"), get: (a) => new Date(a.created_at).toLocaleString() },
  ];

  async function delSub(id: string) {
    if (!confirm(L("Fshije abonuesin?", "Delete subscriber?"))) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    logAction("newsletter.deleted", "newsletter_subscribers", id, {});
    qc.invalidateQueries({ queryKey: ["newsletter-subs"] });
  }

  async function markNotified(a: Alert) {
    const { error } = await supabase.from("stock_alerts").update({ notified: !a.notified }).eq("id", a.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["stock-alerts"] });
  }

  function copyEmails() {
    const text = subRows.filter((s) => s.active).map((s) => s.email).join(", ");
    if (!text) return toast.error(L("Nuk ka abonues", "No subscribers"));
    navigator.clipboard.writeText(text);
    toast.success(L("Emailat u kopjuan", "Emails copied"));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button onClick={() => setTab("subs")} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${tab === "subs" ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-600"}`}>
            {L("Abonuesit", "Subscribers")} ({subRows.length})
          </button>
          <button onClick={() => setTab("alerts")} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${tab === "alerts" ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-600"}`}>
            {L("Kërkesa për stok", "Back-in-stock")} ({alertRows.filter((a) => !a.notified).length})
          </button>
        </div>
        <div className="flex items-center gap-2">
          {tab === "subs" && (
            <button onClick={copyEmails} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
              <Copy className="h-3.5 w-3.5" /> {L("Kopjo emailat", "Copy emails")}
            </button>
          )}
          {tab === "subs" ? (
            <ExportButtons filename="newsletter" title={L("Abonuesit", "Subscribers")} columns={subCols} rows={subRows} entity="newsletter_subscribers" labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka abonues", "No subscribers") }} />
          ) : (
            <ExportButtons filename="kerkesa-stoku" title={L("Kërkesa për stok", "Back-in-stock requests")} columns={alertCols} rows={alertRows} entity="stock_alerts" labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka kërkesa", "No requests") }} />
          )}
        </div>
      </div>

      <Panel>
        {tab === "subs" ? (
          subRows.length === 0 ? (
            <Empty label={L("Nuk ka abonues.", "No subscribers.")} />
          ) : (
            <div className="divide-y divide-neutral-100">
              {subRows.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-medium">{s.email}</div>
                    <div className="text-xs text-neutral-500">{s.lang.toUpperCase()} · {new Date(s.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => delSub(s.id)} className="grid h-8 w-8 place-items-center rounded-full text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : alertRows.length === 0 ? (
          <Empty label={L("Nuk ka kërkesa.", "No requests.")} />
        ) : (
          <div className="divide-y divide-neutral-100">
            {alertRows.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium">{a.email}</div>
                  <div className="text-xs text-neutral-500">{a.product_name} · {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => markNotified(a)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${a.notified ? "border border-neutral-300 text-neutral-500" : "bg-green-600 text-white"}`}
                >
                  <Check className="h-3.5 w-3.5" /> {a.notified ? L("Njoftuar", "Notified") : L("Shëno si njoftuar", "Mark notified")}
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
