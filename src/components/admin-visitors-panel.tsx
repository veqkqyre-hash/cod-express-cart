import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { Globe, Users, Eye, MonitorSmartphone } from "lucide-react";

type Visit = {
  id: string;
  session_id: string | null;
  path: string;
  referrer: string | null;
  ip: string | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  region: string | null;
  device: string | null;
  language: string | null;
  user_agent: string | null;
  created_at: string;
};

function flag(code: string | null) {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

export function VisitorsPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("today");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-visitors", range],
    refetchInterval: 60000,
    queryFn: async () => {
      let q = supabase.from("visitor_logs").select("*").order("created_at", { ascending: false }).limit(1000);
      if (range !== "all") {
        const since = new Date();
        if (range === "today") since.setHours(0, 0, 0, 0);
        else since.setDate(since.getDate() - (range === "7d" ? 7 : 30));
        q = q.gte("created_at", since.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Visit[];
    },
  });

  const list = data ?? [];
  const s = search.trim().toLowerCase();
  const rows = list.filter((v) =>
    !s ||
    (v.ip ?? "").includes(s) ||
    (v.country ?? "").toLowerCase().includes(s) ||
    (v.city ?? "").toLowerCase().includes(s) ||
    v.path.toLowerCase().includes(s),
  );

  const uniqueVisitors = new Set(list.map((v) => v.session_id ?? v.ip ?? v.id)).size;
  const uniqueIps = new Set(list.map((v) => v.ip).filter(Boolean)).size;

  const byCountry = Object.entries(
    list.reduce<Record<string, { code: string | null; name: string; visits: number; people: Set<string> }>>((acc, v) => {
      const name = v.country ?? v.country_code ?? L("E panjohur", "Unknown");
      acc[name] ??= { code: v.country_code, name, visits: 0, people: new Set() };
      acc[name].visits++;
      acc[name].people.add(v.session_id ?? v.ip ?? v.id);
      return acc;
    }, {}),
  )
    .map(([, c]) => ({ ...c, people: c.people.size }))
    .sort((a, b) => b.visits - a.visits);

  const byDevice = list.reduce<Record<string, number>>((acc, v) => {
    const d = v.device ?? "Unknown";
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});

  const columns: Column<Visit>[] = [
    { key: "created_at", label: L("Ora", "Time"), get: (r) => new Date(r.created_at).toLocaleString() },
    { key: "country", label: L("Shteti", "Country"), get: (r) => r.country ?? r.country_code ?? "" },
    { key: "city", label: L("Qyteti", "City"), get: (r) => r.city ?? "" },
    { key: "ip", label: "IP", get: (r) => r.ip ?? "" },
    { key: "path", label: L("Faqja", "Page"), get: (r) => r.path },
    { key: "device", label: L("Pajisja", "Device"), get: (r) => r.device ?? "" },
    { key: "referrer", label: L("Burimi", "Referrer"), get: (r) => r.referrer ?? "" },
  ];

  const inputCls = "rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200";
  const card = "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={card}>
          <div className="flex items-start justify-between">
            <div><div className="text-sm text-neutral-500">{L("Vizita", "Page views")}</div><div className="mt-2 font-display text-3xl">{list.length}</div></div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-pink-50 text-pink-600"><Eye className="h-5 w-5" /></div>
          </div>
        </div>
        <div className={card}>
          <div className="flex items-start justify-between">
            <div><div className="text-sm text-neutral-500">{L("Vizitorë unikë", "Unique visitors")}</div><div className="mt-2 font-display text-3xl">{uniqueVisitors}</div></div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-600"><Users className="h-5 w-5" /></div>
          </div>
        </div>
        <div className={card}>
          <div className="flex items-start justify-between">
            <div><div className="text-sm text-neutral-500">{L("IP unike", "Unique IPs")}</div><div className="mt-2 font-display text-3xl">{uniqueIps}</div></div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Globe className="h-5 w-5" /></div>
          </div>
        </div>
        <div className={card}>
          <div className="text-sm text-neutral-500">{L("Pajisjet", "Devices")}</div>
          <div className="mt-2 space-y-1 text-sm">
            {Object.entries(byDevice).map(([d, n]) => (
              <div key={d} className="flex justify-between"><span>{d}</span><span className="font-medium">{n}</span></div>
            ))}
            {Object.keys(byDevice).length === 0 && <div className="text-neutral-400">—</div>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className={inputCls}>
            <option value="today">{L("Sot", "Today")}</option>
            <option value="7d">{L("7 ditët e fundit", "Last 7 days")}</option>
            <option value="30d">{L("30 ditët e fundit", "Last 30 days")}</option>
            <option value="all">{L("Të gjitha", "All time")}</option>
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={L("Kërko IP, shtet, qytet, faqe…", "Search IP, country, city, page…")}
            className={`flex-1 min-w-56 ${inputCls}`}
          />
          <ExportButtons
            entity="visitor_logs"
            filename={`dream-studio-vizitore-${new Date().toISOString().slice(0, 10)}`}
            title={L("Raport i vizitorëve", "Visitors report")}
            subtitle={`${rows.length} ${L("vizita", "views")}`}
            columns={columns}
            rows={rows}
            labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka të dhëna", "Nothing to export") }}
          />
        </div>
        <div className="mt-3 text-xs text-neutral-500">{isLoading ? "…" : `${rows.length} ${L("vizita", "views")}`}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg">{L("Sipas shtetit", "By country")}</h3>
          <div className="mt-3 space-y-2 text-sm">
            {byCountry.slice(0, 12).map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span>{flag(c.code)}</span>{c.name}</span>
                <span className="text-neutral-500">{c.people} · <span className="font-medium text-neutral-900">{c.visits}</span></span>
              </div>
            ))}
            {byCountry.length === 0 && <div className="text-neutral-400">{L("Asnjë vizitor", "No visitors yet")}</div>}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:col-span-2">
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{L("Ora", "Time")}</th>
                  <th className="px-4 py-3">{L("Shteti", "Country")}</th>
                  <th className="px-4 py-3 hidden md:table-cell">IP</th>
                  <th className="px-4 py-3 hidden sm:table-cell">{L("Faqja", "Page")}</th>
                  <th className="px-4 py-3 hidden lg:table-cell">{L("Pajisja", "Device")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 300).map((v) => (
                  <tr key={v.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{new Date(v.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="mr-1.5">{flag(v.country_code)}</span>
                      {v.country ?? v.country_code ?? "—"}
                      {v.city && <span className="text-neutral-500"> · {v.city}</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">{v.ip ?? "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-neutral-500">{v.path}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-neutral-500">
                      <span className="inline-flex items-center gap-1.5"><MonitorSmartphone className="h-3.5 w-3.5" />{v.device ?? "—"}</span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-500">{L("Asnjë vizitor", "No visitors yet")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
