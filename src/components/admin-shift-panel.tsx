import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { Clock, LockOpen, Lock, Trash2 } from "lucide-react";

export type ShiftRow = {
  id: string;
  opened_email: string | null;
  opened_at: string;
  opening_cash: number;
  closed_at: string | null;
  closed_email: string | null;
  counted_cash: number | null;
  expected_cash: number | null;
  difference: number | null;
  cash_sales: number;
  card_sales: number;
  other_sales: number;
  sales_count: number;
  status: string;
  note: string | null;
};

export type CurrentShift = {
  shift: ShiftRow;
  cash_sales: number;
  card_sales: number;
  other_sales: number;
  sales_count: number;
  expected_cash: number;
} | null;

export function useCurrentShift() {
  return useQuery({
    queryKey: ["pos-current-shift"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("current_pos_shift");
      if (error) throw error;
      return (data ?? null) as unknown as CurrentShift;
    },
  });
}

export function ShiftBar({ compact = false }: { compact?: boolean }) {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data: current, refetch, isLoading } = useCurrentShift();
  const [openCash, setOpenCash] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    const { error } = await supabase.rpc("open_pos_shift", {
      _opening_cash: openCash === "" ? 0 : Number(openCash),
      ...(note ? { _note: note } : {}),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setOpenCash("");
    setNote("");
    toast.success(L("Sesioni i punës u hap.", "Shift opened."));
    refetch();
  }

  async function close() {
    if (!confirm(L("Mbyll sesionin e punës?", "Close the work shift?"))) return;
    setBusy(true);
    const { error } = await supabase.rpc("close_pos_shift", {
      ...(countedCash === "" ? {} : { _counted_cash: Number(countedCash) }),
      ...(note ? { _note: note } : {}),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setCountedCash("");
    setNote("");
    toast.success(L("Sesioni u mbyll.", "Shift closed."));
    refetch();
  }

  if (isLoading) return null;

  if (!current) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <Clock className="h-4 w-4" /> {L("Nuk ka sesion pune të hapur", "No open work shift")}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-amber-900">
              {L("Para në arkë (fillim)", "Opening cash")}
            </label>
            <input
              type="number"
              step="0.01"
              value={openCash}
              onChange={(e) => setOpenCash(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-36 rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={open}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <LockOpen className="h-4 w-4" /> {L("HAP SESIONIN", "OPEN SHIFT")}
          </button>
        </div>
      </div>
    );
  }

  const s = current.shift;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
          {L("Sesion i hapur", "Shift open")} · {s.opened_email ?? ""} ·{" "}
          {new Date(s.opened_at).toLocaleString(lang === "sq" ? "sq" : "en")}
        </div>
        <div className="text-xs text-neutral-500">
          {current.sales_count} {L("shitje", "sales")}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [L("Fillimi", "Opening"), s.opening_cash],
          [L("Kesh", "Cash"), current.cash_sales],
          [L("Kartë", "Card"), current.card_sales],
          [L("Pritet në arkë", "Expected cash"), current.expected_cash],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded-xl bg-neutral-50 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="font-display text-lg">{formatEur(Number(val))}</div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              {L("Para të numëruara", "Counted cash")}
            </label>
            <input
              type="number"
              step="0.01"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              className="mt-1 w-36 rounded-xl border border-neutral-300 px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-neutral-600">{L("Shënim", "Note")}</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={close}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" /> {L("MBYLL SESIONIN", "CLOSE SHIFT")}
          </button>
          {countedCash !== "" && (
            <div className="text-sm">
              {L("Diferenca", "Difference")}:{" "}
              <span className={Number(countedCash) - current.expected_cash < 0 ? "text-red-600" : "text-green-700"}>
                {formatEur(Number(countedCash) - current.expected_cash)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ShiftsPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data: shifts, refetch } = useQuery({
    queryKey: ["pos-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_shifts")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as ShiftRow[];
    },
  });

  return (
    <div className="space-y-4">
      <ShiftBar />
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">{L("Hapur", "Opened")}</th>
              <th className="px-4 py-3">{L("Mbyllur", "Closed")}</th>
              <th className="px-4 py-3">{L("Arkatari", "Cashier")}</th>
              <th className="px-4 py-3 text-right">{L("Shitje", "Sales")}</th>
              <th className="px-4 py-3 text-right">{L("Kesh", "Cash")}</th>
              <th className="px-4 py-3 text-right">{L("Kartë", "Card")}</th>
              <th className="px-4 py-3 text-right">{L("Numëruar", "Counted")}</th>
              <th className="px-4 py-3 text-right">{L("Diferenca", "Difference")}</th>
              <th className="px-4 py-3 text-right">{L("Veprime", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {(shifts ?? []).length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-neutral-500">
                  {L("Nuk ka sesione.", "No shifts yet.")}
                </td>
              </tr>
            )}
            {(shifts ?? []).map((s) => (
              <tr key={s.id} className="border-t border-neutral-100">
                <td className="px-4 py-3">{new Date(s.opened_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {s.closed_at ? new Date(s.closed_at).toLocaleString() : L("hapur", "open")}
                </td>
                <td className="px-4 py-3">{s.opened_email ?? "—"}</td>
                <td className="px-4 py-3 text-right">{s.sales_count}</td>
                <td className="px-4 py-3 text-right">{formatEur(Number(s.cash_sales))}</td>
                <td className="px-4 py-3 text-right">{formatEur(Number(s.card_sales))}</td>
                <td className="px-4 py-3 text-right">
                  {s.counted_cash == null ? "—" : formatEur(Number(s.counted_cash))}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    s.difference != null && Number(s.difference) < 0 ? "text-red-600" : ""
                  }`}
                >
                  {s.difference == null ? "—" : formatEur(Number(s.difference))}
                </td>
                <td className="px-4 py-3 text-right">
                  {s.closed_at ? (
                    <button
                      onClick={async () => {
                        if (!confirm(L("Fshij këtë sesion pune? Shitjet ruhen, por shkëputen nga sesioni.", "Delete this work shift? Sales are kept but unlinked from the shift."))) return;
                        const { error } = await supabase.rpc("delete_pos_shift", { _id: s.id });
                        if (error) return toast.error(error.message);
                        toast.success(L("Sesioni u fshi.", "Shift deleted."));
                        refetch();
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {L("Fshij", "Delete")}
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-400">{L("hapur", "open")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
