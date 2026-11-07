import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { GalleryField } from "@/components/admin-gallery-field";
import { generateProductDescription } from "@/lib/ai-image.functions";
import { Plus, Pencil, Trash2, X, ImagePlus, Loader2, Sparkles } from "lucide-react";

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
  images?: string[] | null;
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
    let gallery: string[] = [];
    try { gallery = JSON.parse(String(fd.get("gallery_json") || "[]")); } catch { gallery = []; }
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
      images: gallery,
      image_url: gallery[0] ?? null,
      category_id: String(fd.get("category_id") || "") || null,
      active: fd.get("active") === "on",
      featured: fd.get("featured") === "on",
    };
    if (!payload.name_sq || !payload.name_en || !payload.price) {
      toast.error(lang === "sq" ? "Plotësoni fushat" : "Fill required fields");
      return;
    }
    if (payload.barcode && !BARCODE_RE.test(payload.barcode)) {
      toast.error(
        lang === "sq"
          ? "Barkod i pavlefshëm: 4–32 karaktere, vetëm shifra/shkronja dhe -, pa zbrazëti."
          : "Invalid barcode: 4–32 characters, digits/letters and - only, no spaces.",
      );
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
            // Enter bllokohet vetëm në fushat e skanimit (barkod / SKU) — skaneri dërgon Enter në fund
            const el = e.target as HTMLInputElement;
            const scanField = el.tagName === "INPUT" && (el.name === "barcode" || el.name === "sku");
            if (e.key === "Enter" && scanField) e.preventDefault();
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
            <BarcodeField lang={lang} defaultValue={product?.barcode ?? ""} />
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

          <GalleryField
            lang={lang}
            initial={product?.images?.length ? product.images : product?.image_url ? [product.image_url] : []}
            getName={() => (document.querySelector<HTMLInputElement>('input[name="name_en"]')?.value || document.querySelector<HTMLInputElement>('input[name="name_sq"]')?.value || "")}
          />
          <FieldA label="Slug" name="slug" defaultValue={product?.slug ?? ""} />

          <AiDescriptionButton lang={lang} />
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

/** Buton që gjeneron përshkrimin SQ/EN me AI nga emri i produktit dhe i mbush fushat. */
function AiDescriptionButton({ lang }: { lang: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [busy, setBusy] = useState(false);

  async function onGenerate() {
    const name =
      document.querySelector<HTMLInputElement>('input[name="name_sq"]')?.value.trim() ||
      document.querySelector<HTMLInputElement>('input[name="name_en"]')?.value.trim() ||
      "";
    if (name.length < 2) {
      toast.error(L("Shkruani së pari emrin e produktit.", "Enter the product name first."));
      return;
    }
    setBusy(true);
    try {
      const res = await generateProductDescription({ data: { name } });
      const sq = document.querySelector<HTMLTextAreaElement>('textarea[name="description_sq"]');
      const en = document.querySelector<HTMLTextAreaElement>('textarea[name="description_en"]');
      if (sq) sq.value = res.sq;
      if (en) en.value = res.en;
      toast.success(L("Përshkrimi u gjenerua — kontrollojeni para ruajtjes.", "Description generated — review it before saving."));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : L("Gjenerimi dështoi.", "Generation failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={busy}
      className="inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {busy ? L("Duke gjeneruar…", "Generating…") : L("Gjenero përshkrimin me AI (SQ + EN)", "Generate description with AI (SQ + EN)")}
    </button>
  );
}

/** Foto e produktit: ngarkim file-i në storage ose URL manuale. */
function ImageField({ lang, defaultValue }: { lang: string; defaultValue: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(L("Zgjidhni një file fotoje (JPG, PNG, WebP).", "Choose an image file (JPG, PNG, WebP)."));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(L("Fotoja është mbi 10 MB.", "The image is over 10 MB."));
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "31536000", upsert: false });
    setUploading(false);
    if (error) {
      toast.error(L("Ngarkimi dështoi: ", "Upload failed: ") + error.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setUrl(data.publicUrl);
    toast.success(L("Fotoja u ngarkua", "Image uploaded"));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{L("Foto e produktit", "Product image")}</label>
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-muted-foreground"><ImagePlus className="h-6 w-6" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? L("Duke ngarkuar…", "Uploading…") : L("Ngarko foto", "Upload photo")}
          </button>
          <input
            name="image_url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={L("ose vendos URL të fotos", "or paste an image URL")}
            autoComplete="off"
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}

/** Barkodi: 4–32 karaktere, shifra/shkronja/-/_ , pa zbrazëti. */
export const BARCODE_RE = /^[A-Za-z0-9._-]{4,32}$/;

function BarcodeField({ lang, defaultValue }: { lang: string; defaultValue: string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const lastKey = useRef(0);
  const fast = useRef(0);

  const invalid = value.trim().length > 0 && !BARCODE_RE.test(value.trim());
  const hasSpace = /\s/.test(value);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const now = Date.now();
    if (now - lastKey.current < 35) fast.current += 1;
    else if (e.key !== "Enter") fast.current = 0;
    lastKey.current = now;

    if (e.key === "Enter") {
      e.preventDefault();
      const v = (e.currentTarget.value || "").trim();
      setTouched(true);
      if (!v) {
        toast.error(L("Skanimi nuk prodhoi vlerë — provo përsëri.", "The scan produced no value — try again."));
      } else if (!BARCODE_RE.test(v)) {
        toast.error(L("Barkod i pavlefshëm: pa zbrazëti, 4–32 karaktere.", "Invalid barcode: no spaces, 4–32 characters."));
      } else {
        setValue(v);
        toast.success(`${L("Barkodi u skanua", "Barcode scanned")}: ${v}`);
      }
      fast.current = 0;
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{L("Barkodi", "Barcode")}</label>
      <input
        name="barcode"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\s+/g, ""))}
        onBlur={() => setTouched(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        maxLength={32}
        placeholder={L("Skano ose shkruaj barkodin", "Scan or type the barcode")}
        aria-invalid={invalid}
        className={`w-full rounded-xl border bg-background px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 ${
          touched && invalid ? "border-destructive focus:ring-destructive" : "border-input focus:ring-ring"
        }`}
      />
      {touched && invalid ? (
        <p className="mt-1 text-xs text-destructive">
          {hasSpace
            ? L("Barkodi nuk mund të ketë zbrazëti.", "The barcode cannot contain spaces.")
            : L("4–32 karaktere: shifra, shkronja, - ose _", "4–32 characters: digits, letters, - or _")}
        </p>
      ) : (
        <p className="mt-1 text-xs text-neutral-500">
          {L("Kliko brenda dhe skano — Enter nuk e ruan formularin.", "Click inside and scan — Enter does not submit the form.")}
        </p>
      )}
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
