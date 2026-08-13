import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type ProductRow = {
  id: string;
  slug: string;
  category_id: string | null;
  name_sq: string;
  name_en: string;
  description_sq: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  active: boolean;
  featured: boolean;
  barcode: string | null;
  sku: string | null;
  cost_price: number;
};

export function ProductsPanel() {
  const { tr, lang } = useI18n();
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);

  const { data: products, refetch } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name_sq,name_en,slug").order("sort_order");
      return data ?? [];
    },
  });

  async function onDelete(id: string) {
    if (!confirm(tr("deleteConfirm"))) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(lang === "sq" ? "U fshi" : "Deleted"); refetch(); }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> {tr("addProduct")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">{tr("productName")}</th>
                <th className="px-4 py-3">{lang === "sq" ? "Barkodi" : "Barcode"}</th>
                <th className="px-4 py-3">{tr("price")}</th>
                <th className="px-4 py-3">{tr("stock")}</th>
                <th className="px-4 py-3">{tr("active")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />}
                  </td>
                  <td className="px-4 py-3 font-medium">{lang === "sq" ? p.name_sq : p.name_en}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{p.barcode ?? "—"}</td>
                  <td className="px-4 py-3">{formatEur(Number(p.price))}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">{p.active ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(p)} className="inline-grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(p.id)} className="inline-grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductEditor
          product={editing === "new" ? null : editing}
          categories={categories ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </div>
  );
}

function ProductEditor({ product, categories, onClose, onSaved }: {
  product: ProductRow | null;
  categories: { id: string; name_sq: string; name_en: string; slug: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { tr, lang } = useI18n();
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameEn = String(fd.get("name_en") || "").trim();
    const payload = {
      slug: String(fd.get("slug") || "").trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name_sq: String(fd.get("name_sq") || "").trim(),
      name_en: nameEn,
      description_sq: String(fd.get("description_sq") || "") || null,
      description_en: String(fd.get("description_en") || "") || null,
      price: Number(fd.get("price")),
      cost_price: Number(fd.get("cost_price") || 0),
      barcode: String(fd.get("barcode") || "").trim() || null,
      sku: String(fd.get("sku") || "").trim() || null,
      stock: Number(fd.get("stock")),
      image_url: String(fd.get("image_url") || "") || null,
      category_id: String(fd.get("category_id") || "") || null,
      active: fd.get("active") === "on",
      featured: fd.get("featured") === "on",
    };
    if (!payload.name_sq || !payload.name_en || !payload.price) {
      toast.error(lang === "sq" ? "Plotësoni fushat" : "Fill required fields");
      return;
    }
    setSaving(true);
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(lang === "sq" ? "U ruajt" : "Saved"); onSaved(); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-background shadow-elev" onClick={(e) => e.stopPropagation()}>
        <form
          onSubmit={onSubmit}
          onKeyDown={(e) => {
            // Barcode scanners send Enter after the code — don't submit the form mid-entry
            const el = e.target as HTMLElement;
            if (e.key === "Enter" && el.tagName === "INPUT") e.preventDefault();
          }}
          className="p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">{product ? tr("editProduct") : tr("addProduct")}</h2>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldA label={`${tr("productName")} (SQ)`} name="name_sq" defaultValue={product?.name_sq} required />
            <FieldA label={`${tr("productName")} (EN)`} name="name_en" defaultValue={product?.name_en} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldA label={lang === "sq" ? "Barkodi" : "Barcode"} name="barcode" defaultValue={product?.barcode ?? ""} />
            <FieldA label="SKU" name="sku" defaultValue={product?.sku ?? ""} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldA label={(lang === "sq" ? "Çmimi i blerjes" : "Cost price") + " (€)"} name="cost_price" type="number" step="0.01" defaultValue={(product?.cost_price ?? 0).toString()} />
            <FieldA label={(lang === "sq" ? "Çmimi i shitjes" : "Sale price") + " (€)"} name="price" type="number" step="0.01" defaultValue={product?.price?.toString()} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2"> <FieldA label={tr("stock")} name="stock" type="number" defaultValue={(product?.stock ?? 0).toString()} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium">{tr("category")}</label>
              <select name="category_id" defaultValue={product?.category_id ?? ""} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{lang === "sq" ? c.name_sq : c.name_en}</option>)}
              </select>
            </div>
          </div>

          <FieldA label={tr("imageUrl")} name="image_url" defaultValue={product?.image_url ?? ""} />
          <FieldA label="Slug" name="slug" defaultValue={product?.slug ?? ""} />

          <div>
            <label className="mb-1.5 block text-sm font-medium">{tr("descriptionLabel")} (SQ)</label>
            <textarea name="description_sq" rows={2} defaultValue={product?.description_sq ?? ""} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{tr("descriptionLabel")} (EN)</label>
            <textarea name="description_en" rows={2} defaultValue={product?.description_en ?? ""} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          </div>

          <div className="flex gap-6">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={product ? product.active : true} /> {tr("active")}</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> {tr("featuredLabel")}</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted">{tr("cancel")}</button>
            <button disabled={saving} className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? "…" : tr("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldA({ label, name, type = "text", defaultValue, required, step }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean; step?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</label>
      <input name={name} type={type} step={step} defaultValue={defaultValue} required={required} autoComplete="off" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
