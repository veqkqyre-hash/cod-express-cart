import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { ScrollText } from "lucide-react";

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
  a.includes("delete") || a.includes("revoke")
    ? "bg-red-50 text-red-700"
    : a.includes("create") || a.includes("grant")
      ? "bg-green-50 text-green-700"
      : a.includes("export")
        ? "bg-neutral-100 text-neutral-700"
        : "bg-blue-50 text-blue-700";

export function AuditPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("");

  const { data, isLoading } = useQuery({
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
  const rows = list.filter((l) => {
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

  const inputCls = "rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200";

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
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
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
        <div className="mt-3 text-xs text-neutral-500">
          {isLoading ? "…" : `${rows.length} ${L("veprime", "actions")}`}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">{L("Data", "Date")}</th>
                <th className="px-4 py-3">{L("Përdoruesi", "User")}</th>
                <th className="px-4 py-3">{L("Veprimi", "Action")}</th>
                <th className="px-4 py-3 hidden md:table-cell">{L("Objekti", "Entity")}</th>
                <th className="px-4 py-3 hidden lg:table-cell">{L("Detajet", "Details")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{l.actor_email ?? <span className="text-neutral-400">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_TONE(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-neutral-500">{l.entity}</td>
                  <td className="px-4 py-3 hidden lg:table-cell max-w-xs truncate font-mono text-xs text-neutral-500">
                    {JSON.stringify(l.details ?? {})}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                    <ScrollText className="mx-auto mb-2 h-5 w-5 text-neutral-300" />
                    {L("Asnjë aktivitet", "No activity yet")}
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
