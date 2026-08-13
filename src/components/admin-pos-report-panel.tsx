import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { Panel } from "@/components/admin-ui";

type Sale = {
  id: string;
  sale_number: string;
  total: number;
  cost_total: number;
  item_count: number;
  payment_method: string;
  created_at: string;
};

type Preset = "today" | "yesterday" | "week" | "month" | "custom";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeFor(preset: Preset, from: string, to: string): { start: Date; end: Date } {
  const now = new Date();
  if (preset === "today") return { start: startOfDay(now), end: now };
  if (preset === "yesterday") {
    const s = startOfDay(new Date(now.getTime() - 86400000));
    return { start: s, end: new Date(s.getTime() + 86400000 - 1) };
  }
  if (preset === "week") {
    const day = (now.getDay() + 6) % 7; // Monday-first
    return { start: startOfDay(new Date(now.getTime() - day * 86400000)), end: now };
  }
  if (preset === "month") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  return {
    start: from ? startOfDay(new Date(from)) : new Date(0),
    end: to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : now,
  };
}

export function PosReportPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [preset, setPreset] = useState<Preset>("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { start, end } = useMemo(() => rangeFor(preset, from, to), [preset, from, to]);

  const { data } = useQuery({
    queryKey: ["pos-report", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_sales")
        .select("id,sale_number,total,cost_total,item_count,payment_method,created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Sale[];
    },
  });

  // Shitjet ONLINE (porositë e website-it) — i njëjti inventar, burim i dallueshëm
  const { data: online } = useQuery({
    queryKey: ["online-report", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id,total,status,created_at")
        .neq("status", "cancelled")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      if (error) throw error;
      const ids = (orders ?? []).map((o) => o.id);
      let itemCount = 0;
      let cost = 0;
      if (ids.length > 0) {
        const { data: oi } = await supabase
          .from("order_items")
          .select("product_id,quantity")
          .in("order_id", ids);
        itemCount = (oi ?? []).reduce((s, r) => s + Number(r.quantity), 0);
        const pids = [...new Set((oi ?? []).map((r) => r.product_id).filter(Boolean))] as string[];
        if (pids.length > 0) {
          const { data: prods } = await supabase.from("products").select("id,cost_price").in("id", pids);
          const costMap = new Map((prods ?? []).map((p) => [p.id, Number(p.cost_price)]));
          cost = (oi ?? []).reduce(
            (s, r) => s + (costMap.get(String(r.product_id)) ?? 0) * Number(r.quantity),
            0,
          );
        }
      }
      return {
        count: (orders ?? []).length,
        revenue: (orders ?? []).reduce((s, o) => s + Number(o.total), 0),
        itemCount,
        cost,
      };
    },
  });

  const rows = data ?? [];
  const posRevenue = rows.reduce((s, r) => s + Number(r.total), 0);
  const posCost = rows.reduce((s, r) => s + Number(r.cost_total), 0);
  const posItems = rows.reduce((s, r) => s + r.item_count, 0);
  const cash = rows.filter((r) => r.payment_method === "cash").reduce((s, r) => s + Number(r.total), 0);
  const card = rows.filter((r) => r.payment_method === "card").reduce((s, r) => s + Number(r.total), 0);
  const other = posRevenue - cash - card;
  const onlineRevenue = online?.revenue ?? 0;
  const onlineCost = online?.cost ?? 0;
  const revenue = posRevenue + onlineRevenue;
  const cost = posCost + onlineCost;
  const items = posItems + (online?.itemCount ?? 0);

  const stats = [
    { label: L("Numri i shitjeve", "Sales count"), value: String(rows.length + (online?.count ?? 0)) },
    { label: L("Shitje nga ARKA", "Register sales"), value: `${rows.length} · ${formatEur(posRevenue)}` },
    { label: L("Shitje ONLINE", "Online sales"), value: `${online?.count ?? 0} · ${formatEur(onlineRevenue)}` },
    { label: L("Produkte të shitura", "Products sold"), value: String(items) },
    { label: L("TOTAL SHITJE", "TOTAL SALES"), value: formatEur(revenue) },
    { label: L("Shitjet cash (arka)", "Cash sales (register)"), value: formatEur(cash) },
    { label: L("Shitjet card (arka)", "Card sales (register)"), value: formatEur(card) },
    { label: L("Tjetër (arka)", "Other (register)"), value: formatEur(other) },
    { label: L("Kostoja totale", "Total cost"), value: formatEur(cost) },
    { label: L("Fitimi total", "Total profit"), value: formatEur(revenue - cost) },
  ];


  const columns: Column<{ label: string; value: string }>[] = [
    { key: "label", label: L("Treguesi", "Metric"), get: (r) => r.label },
    { key: "value", label: L("Vlera", "Value"), get: (r) => r.value },
  ];

  const presets: { key: Preset; label: string }[] = [
    { key: "today", label: L("Sot", "Today") },
    { key: "yesterday", label: L("Dje", "Yesterday") },
    { key: "week", label: L("Këtë javë", "This week") },
    { key: "month", label: L("Këtë muaj", "This month") },
    { key: "custom", label: L("Datë nga / deri", "Custom range") },
  ];

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-center gap-2 p-4">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                preset === p.key ? "bg-neutral-900 text-white" : "border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {p.label}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
              <span className="text-neutral-400">→</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
            </div>
          )}
          <div className="ml-auto">
            <ExportButtons
              filename="pos-raporti"
              title={L("Raporti i shitjeve", "Sales report")}
              subtitle={`${start.toLocaleDateString()} – ${end.toLocaleDateString()}`}
              columns={columns}
              rows={stats}
              footer={`${L("Fitimi", "Profit")}: ${formatEur(revenue - cost)}`}
              entity="pos_report"
              labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka të dhëna", "No data") }}
            />
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{s.label}</div>
            <div className="mt-2 font-display text-2xl">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
