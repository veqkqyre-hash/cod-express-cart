import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { CalendarDays } from "lucide-react";

type Row = {
  period: string;
  orders: number;
  revenue: number;
  delivered: number;
  cancelled: number;
  avg: number;
  visits: number;
  visitors: number;
};

function dayKey(d: string) { return new Date(d).toISOString().slice(0, 10); }
function monthKey(d: string) { return new Date(d).toISOString().slice(0, 7); }

/** Auto-generated daily / monthly reports, downloadable as CSV or PDF. */
export function ReportsPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [mode, setMode] = useState<"daily" | "monthly">("daily");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const [{ data: orders }, { data: visits }] = await Promise.all([
        supabase.from("orders").select("created_at,total,status"),
        supabase.from("visitor_logs").select("created_at,session_id,ip").limit(5000),
      ]);
      return { orders: orders ?? [], visits: visits ?? [] };
    },
  });

  const key = mode === "daily" ? dayKey : monthKey;
  const buckets: Record<string, Row & { people: Set<string> }> = {};
  const ensure = (k: string) => (buckets[k] ??= {
    period: k, orders: 0, revenue: 0, delivered: 0, cancelled: 0, avg: 0, visits: 0, visitors: 0, people: new Set<string>(),
  });

  for (const o of data?.orders ?? []) {
    const b = ensure(key(o.created_at));
    b.orders++;
    b.revenue += Number(o.total || 0);
    if (o.status === "delivered") b.delivered++;
    if (o.status === "cancelled") b.cancelled++;
  }
  for (const v of data?.visits ?? []) {
    const b = ensure(key(v.created_at));
    b.visits++;
    b.people.add(v.session_id ?? v.ip ?? Math.random().toString());
  }

  const rows: Row[] = Object.values(buckets)
    .map((b) => ({ ...b, visitors: b.people.size, avg: b.orders ? b.revenue / b.orders : 0 }))
    .sort((a, b) => (a.period < b.period ? 1 : -1))
    .slice(0, mode === "daily" ? 60 : 24);

  const columns: Column<Row>[] = [
    { key: "period", label: mode === "daily" ? L("Dita", "Day") : L("Muaji", "Month"), get: (r) => r.period },
    { key: "orders", label: L("Porosi", "Orders"), get: (r) => r.orders },
    { key: "revenue", label: L("Të ardhura", "Revenue"), get: (r) => r.revenue.toFixed(2) },
    { key: "avg", label: L("Mesatarja", "Avg order"), get: (r) => r.avg.toFixed(2) },
    { key: "delivered", label: L("Dorëzuar", "Delivered"), get: (r) => r.delivered },
    { key: "cancelled", label: L("Anuluar", "Cancelled"), get: (r) => r.cancelled },
    { key: "visits", label: L("Vizita", "Visits"), get: (r) => r.visits },
    { key: "visitors", label: L("Vizitorë", "Visitors"), get: (r) => r.visitors },
  ];

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const inputCls = "rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
            <CalendarDays className="h-4 w-4" /> {L("Raporte automatike", "Automated reports")}
          </span>
          <select value={mode} onChange={(e) => setMode(e.target.value as "daily" | "monthly")} className={inputCls}>
            <option value="daily">{L("Ditore", "Daily")}</option>
            <option value="monthly">{L("Mujore", "Monthly")}</option>
          </select>
          <div className="ml-auto">
            <ExportButtons
              entity="reports"
              filename={`dream-studio-raport-${mode}-${new Date().toISOString().slice(0, 10)}`}
              title={mode === "daily" ? L("Raport ditor", "Daily report") : L("Raport mujor", "Monthly report")}
              subtitle={`${rows.length} ${mode === "daily" ? L("ditë", "days") : L("muaj", "months")}`}
              columns={columns}
              rows={rows}
              footer={`${L("Të ardhura totale", "Total revenue")}: ${formatEur(totalRevenue)}`}
              labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka të dhëna", "Nothing to export") }}
            />
          </div>
        </div>
        <div className="mt-3 text-xs text-neutral-500">
          {isLoading ? "…" : `${rows.length} ${L("periudha", "periods")} · ${formatEur(totalRevenue)}`}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                {columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.period} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{r.period}</td>
                  <td className="px-4 py-3">{r.orders}</td>
                  <td className="px-4 py-3">{formatEur(r.revenue)}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatEur(r.avg)}</td>
                  <td className="px-4 py-3 text-green-600">{r.delivered}</td>
                  <td className="px-4 py-3 text-red-600">{r.cancelled}</td>
                  <td className="px-4 py-3 text-neutral-500">{r.visits}</td>
                  <td className="px-4 py-3 text-neutral-500">{r.visitors}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-500">{L("Nuk ka të dhëna", "No data yet")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
