import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExportButtons } from "@/components/admin-export";
import type { Column } from "@/lib/export";
import { Panel, Empty } from "@/components/admin-ui";

type Refill = { id: string; product_name: string | null; old_stock: number; new_stock: number; added: number; created_at: string };

export function StockRefillsPanel({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const { data } = useQuery({
    queryKey: ["stock-refills"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_refills").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return (data ?? []) as Refill[];
    },
  });
  const rows = data ?? [];
  const columns: Column<Refill>[] = [
    { key: "date", label: L("Data", "Date"), get: (r) => new Date(r.created_at).toLocaleString() },
    { key: "product", label: L("Produkti", "Product"), get: (r) => r.product_name },
    { key: "old", label: L("Stoku para", "Before"), get: (r) => r.old_stock },
    { key: "added", label: L("Shtuar", "Added"), get: (r) => r.added },
    { key: "new", label: L("Stoku pas", "After"), get: (r) => r.new_stock },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">{L("Mbushjet e stokut", "Stock refills")} · {rows.reduce((a, r) => a + r.added, 0)} {L("copë", "pcs")}</h3>
        <ExportButtons filename="mbushjet-stokut" title={L("Mbushjet e stokut", "Stock refills")} columns={columns} rows={rows} entity="stock_refills"
          labels={{ csv: "CSV", pdf: "PDF", empty: L("Nuk ka mbushje", "No refills") }} />
      </div>
      <Panel>
        {rows.length === 0 ? <Empty label={L("Ende nuk ka mbushje stoku. Kur rritni stokun e një produkti, del këtu.", "No refills yet. Increasing a product's stock shows up here.")} /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500"><tr>
              {columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
            </tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 text-neutral-500">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{r.product_name}</td>
                <td className="px-4 py-3">{r.old_stock}</td>
                <td className="px-4 py-3 font-semibold text-emerald-600">+{r.added}</td>
                <td className="px-4 py-3">{r.new_stock}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Panel>
    </div>
  );
}
