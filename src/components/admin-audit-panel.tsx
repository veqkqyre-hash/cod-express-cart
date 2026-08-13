import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { ScrollText, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";

type Log = {
  id: string;
  actor_email: string | null;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: unknown;
  created_at: string;
};

const ACTION_TONE = (a: string) =>
  a.includes("delete") || a.includes("revoke") || a.includes("invalid") || a.includes("not_found")
    ? "bg-red-50 text-red-700"
    : a.includes("create") || a.includes("grant") || a.includes("sale")
      ? "bg-green-50 text-green-700"
      : a.includes("export")
        ? "bg-neutral-100 text-neutral-700"
        : "bg-blue-50 text-blue-700";

type Preset = { id: string; sq: string; en: string; match: (l: Log) => boolean };

const PRESETS: Preset[] = [
  { id: "all", sq: "Të gjitha", en: "All", match: () => true },
  { id: "scan", sq: "Skanimet", en: "Scans", match: (l) => l.action.startsWith("pos.scan") },
  { id: "pos", sq: "Arka", en: "Register", match: (l) => l.action.startsWith("pos.") && !l.action.startsWith("pos.scan") },
  { id: "orders", sq: "Porositë", en: "Orders", match: (l) => l.action.startsWith("order.") },
  { id: "roles", sq: "Rolet", en: "Roles", match: (l) => l.action.startsWith("role.") },
  { id: "errors", sq: "Gabimet", en: "Errors", match: (l) => /invalid|not_found|delete|revoke/.test(l.action) },
];

const RANGES = [
  { id: "1", sq: "Sot", en: "Today", days: 1 },
  { id: "7", sq: "7 ditë", en: "7 days", days: 7 },
  { id: "30", sq: "30 ditë", en: "30 days", days: 30 },
  { id: "all", sq: "Gjithçka", en: "All time", days: 0 },
];

export function AuditPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("");
  const [preset, setPreset] = useState("all");
  const [range, setRange] = useState("7");
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Log[];
    },
  });

  const list = data ?? [];
  const entities = Array.from(new Set(list.map((l) => l.entity))).sort();
  const s = search.trim().toLowerCase();
  const days = RANGES.find((r) => r.id === range)?.days ?? 0;
  const since = days ? Date.now() - days * 86_400_000 : 0;
  const match = PRESETS.find((p) => p.id === preset)?.match ?? (() => true);

  const rows = list.filter((l) => {
    if (!match(l)) return false;
    if (since && new Date(l.created_at).getTime() < since) return false;
    if (entity && l.entity !== entity) return false;
    if (!s) return true;
    return (
      l.action.toLowerCase().includes(s) ||
      (l.actor_email ?? "").toLowerCase().includes(s) ||
      (l.entity_id ?? "").toLowerCase().includes(s) ||
      JSON.stringify(l.details ?? {}).toLowerCase().includes(s)
    );
  });

  const columns: Column<Log>[] = [
    { key: "created_at", label: L("Data", "Date"), get: (r) => new Date(r.created_at).toLocaleString() },
    { key: "actor", label: L("Përdoruesi", "User"), get: (r) => r.actor_email ?? r.actor_id ?? "—" },
    { key: "action", label: L("Veprimi", "Action"), get: (r) => r.action },
    { key: "entity", label: L("Objekti", "Entity"), get: (r) => r.entity },
    { key: "entity_id", label: "ID", get: (r) => r.entity_id ?? "" },
    { key: "details", label: L("Detajet", "Details"), get: (r) => JSON.stringify(r.details ?? {}) },
  ];

  const inputCls =
    "rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200";

  const scanFails = rows.filter((l) => l.action === "pos.scan_invalid" || l.action === "pos.scan_not_found").length;
  const scanOk = rows.filter((l) => l.action === "pos.scan").length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={L("Kërko veprim, email, ID…", "Search action, email, ID…")}
            className={`flex-1 min-w-56 ${inputCls}`}
          />
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className={inputCls}>
            <option value="">{L("Të gjitha objektet", "All entities")}</option>
            {entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> {L("Rifresko", "Refresh")}
          </button>
          <ExportButtons
            entity="audit_logs"
            filename={`dream-studio-audit-${new Date().toISOString().slice(0, 10)}`}
            title={L("Regjistri i aktivitetit", "Activity log")}
            subtitle={`${rows.length} ${L("veprime", "actions")}`}
            columns={columns}
            rows={rows}
            labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka të dhëna", "Nothing to export") }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                preset === p.id ? "bg-neutral-900 text-white" : "border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {L(p.sq, p.en)}
            </button>
          ))}
          <span className="mx-2 h-4 w-px bg-neutral-200" />
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                range === r.id ? "bg-neutral-900 text-white" : "border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {L(r.sq, r.en)}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
          <span>{isLoading ? "…" : `${rows.length} ${L("veprime", "actions")}`}</span>
          <span className="text-green-700">
            {scanOk} {L("skanime të suksesshme", "successful scans")}
          </span>
          <span className="text-red-700">
            {scanFails} {L("skanime të dështuara", "failed scans")}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="w-8" />
                <th className="px-4 py-3">{L("Data", "Date")}</th>
                <th className="px-4 py-3">{L("Përdoruesi", "User")}</th>
                <th className="px-4 py-3">{L("Veprimi", "Action")}</th>
                <th className="px-4 py-3 hidden md:table-cell">{L("Objekti", "Entity")}</th>
                <th className="px-4 py-3 hidden lg:table-cell">{L("Detajet", "Details")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <Fragment key={l.id}>
                  <tr
                    onClick={() => setOpen(open === l.id ? null : l.id)}
                    className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="pl-3 text-neutral-400">
                      {open === l.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{l.actor_email ?? <span className="text-neutral-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_TONE(l.action)}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-neutral-500">{l.entity}</td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-xs truncate font-mono text-xs text-neutral-500">
                      {JSON.stringify(l.details ?? {})}
                    </td>
                  </tr>
                  {open === l.id && (
                    <tr className="border-t border-neutral-100 bg-neutral-50/60">
                      <td />
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid gap-1 text-xs text-neutral-600 sm:grid-cols-2">
                          <div>
                            <span className="font-semibold">{L("Objekti", "Entity")}:</span> {l.entity}
                          </div>
                          <div>
                            <span className="font-semibold">ID:</span> {l.entity_id ?? "—"}
                          </div>
                        </div>
                        <pre className="mt-2 overflow-x-auto rounded-xl bg-white p-3 font-mono text-xs text-neutral-700">
                          {JSON.stringify(l.details ?? {}, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                    <ScrollText className="mx-auto mb-2 h-5 w-5 text-neutral-300" />
                    {L("Asnjë aktivitet për këto filtra", "No activity for these filters")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
