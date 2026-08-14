import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Panel, Empty } from "@/components/admin-ui";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { logAction } from "@/lib/audit";

type Row = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  approved: boolean;
  created_at: string;
  products: { name_sq: string; slug: string } | null;
};

export function ReviewsPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const { data } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, products(name_sq,slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const all = data ?? [];
  const rows = all.filter((r) => (filter === "all" ? true : filter === "pending" ? !r.approved : r.approved));
  const pendingCount = all.filter((r) => !r.approved).length;

  async function approve(r: Row) {
    const { error } = await supabase.from("product_reviews").update({ approved: !r.approved }).eq("id", r.id);
    if (error) return toast.error(error.message);
    logAction(r.approved ? "review.unapproved" : "review.approved", "product_reviews", r.id, { rating: r.rating });
    toast.success(r.approved ? L("U fsheh", "Hidden") : L("U publikua", "Published"));
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["reviews"] });
  }

  async function remove(r: Row) {
    if (!confirm(L("Fshije këtë vlerësim?", "Delete this review?"))) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    logAction("review.deleted", "product_reviews", r.id, {});
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["reviews"] });
  }

  const columns: Column<Row>[] = [
    { key: "date", label: L("Data", "Date"), get: (r) => new Date(r.created_at).toLocaleString() },
    { key: "product", label: L("Produkti", "Product"), get: (r) => r.products?.name_sq ?? "" },
    { key: "author", label: L("Klienti", "Customer"), get: (r) => r.author_name },
    { key: "rating", label: L("Yje", "Rating"), get: (r) => r.rating },
    { key: "title", label: L("Titulli", "Title"), get: (r) => r.title ?? "" },
    { key: "body", label: L("Komenti", "Comment"), get: (r) => r.body ?? "" },
    { key: "approved", label: L("Publikuar", "Published"), get: (r) => (r.approved ? "yes" : "no") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${filter === f ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-600"}`}
            >
              {f === "pending" ? `${L("Në pritje", "Pending")} (${pendingCount})` : f === "approved" ? L("Publikuar", "Published") : L("Të gjitha", "All")}
            </button>
          ))}
        </div>
        <ExportButtons
          filename="vleresimet"
          title={L("Vlerësimet", "Reviews")}
          columns={columns}
          rows={rows}
          entity="product_reviews"
          labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka vlerësime", "No reviews") }}
        />
      </div>

      <Panel>
        {rows.length === 0 ? (
          <Empty label={L("Nuk ka vlerësime.", "No reviews.")} />
        ) : (
          <div className="divide-y divide-neutral-100">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} />
                      ))}
                    </span>
                    <span className="text-sm font-semibold">{r.author_name}</span>
                    {!r.approved && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{L("NË PRITJE", "PENDING")}</span>}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {r.products?.name_sq} · {new Date(r.created_at).toLocaleString()}
                  </div>
                  {r.title && <div className="mt-1.5 text-sm font-medium">{r.title}</div>}
                  {r.body && <p className="mt-0.5 text-sm text-neutral-600">{r.body}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve(r)} className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                    <Check className="h-3.5 w-3.5" /> {r.approved ? L("Fshehe", "Hide") : L("Aprovo", "Approve")}
                  </button>
                  <button onClick={() => remove(r)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> {L("Fshi", "Delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
