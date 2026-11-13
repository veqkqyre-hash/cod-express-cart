import { useState, type Dispatch, type SetStateAction, type CSSProperties } from "react";
import { Plus, Trash2, ImagePlus, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Spec, Variant } from "@/lib/product-options";
import { variantColors } from "@/lib/product-options";
import { toast } from "sonner";

export type VariantDraft = Pick<Variant, "id" | "name_sq" | "name_en" | "color_hex" | "image_url" | "price" | "stock" | "active">;
const input = "w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm";
const presets = ["Madhësia / dimensionet", "Pesha", "Madhësia e paketimit", "Materiali", "Modeli / numri", "Njësia e shitjes"];

export function ProductOptionsEditor({ specs, variants, onSpecs, onVariants, onUploading }: {
  specs: Spec[]; variants: VariantDraft[]; onSpecs: (v: Spec[]) => void; onVariants: Dispatch<SetStateAction<VariantDraft[]>>; onUploading: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const change = (id: string, patch: Partial<VariantDraft>) => onVariants(current => current.map(v => v.id === id ? { ...v, ...patch } : v));
  async function upload(id: string, file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error("Zgjidhni JPG, PNG ose WebP deri në 10 MB."); return;
    }
    setUploading(id);
    onUploading(true);
    try {
      const path = `variants/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      change(id, { image_url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Ngarkimi dështoi"); }
    finally { setUploading(null); onUploading(false); }
  }
  function move(index: number, to: number) {
    const next = [...variants]; const [v] = next.splice(index, 1); if (v) next.splice(to, 0, v); onVariants(next);
  }
  return <section aria-label="Variantet & Specifikimet" className="space-y-4 border-t border-border pt-5">
    <h3 className="font-display text-xl">Variantet & Specifikimet</h3>
    <div className="flex items-center justify-between gap-2"><h4 className="font-medium text-sm">Specifikimet</h4>
      <Button type="button" variant="outline" size="sm" onClick={() => onSpecs([...specs, { name: "", value: "" }])}><Plus /> Shto specifikim</Button></div>
    <datalist id="spec-names">{presets.map(p => <option key={p} value={p} />)}</datalist>
    {specs.map((s, i) => <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
      <input aria-label={`Specifikimi ${i + 1}`} list="spec-names" value={s.name} placeholder="Emri" className={input} onChange={e => onSpecs(specs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
      <input aria-label={`Vlera ${i + 1}`} value={s.value} placeholder="Vlera" className={input} onChange={e => onSpecs(specs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
      <Button type="button" variant="ghost" size="icon" title="Hiq specifikimin" aria-label="Hiq specifikimin" onClick={() => onSpecs(specs.filter((_, j) => j !== i))}><Trash2 /></Button>
    </div>)}
    <div className="flex items-center justify-between gap-2"><h4 className="font-medium text-sm">Ngjyrat / variantet</h4>
      <Button type="button" variant="outline" size="sm" onClick={() => onVariants([...variants, { id: crypto.randomUUID(), name_sq: "", name_en: "", color_hex: null, image_url: null, price: null, stock: 0, active: true }])}><Plus /> Shto variant</Button></div>
    <div className="flex flex-wrap gap-2">{variantColors.map(color => <Button key={color.name} type="button" variant="outline" size="icon" title={`Shto ${color.name}`} aria-label={`Shto ${color.name}`} onClick={() => onVariants(current => [...current, { id: crypto.randomUUID(), name_sq: color.name, name_en: color.name, color_hex: color.hex, image_url: null, price: null, stock: 0, active: true }])} className="rounded-full"><span className="variant-swatch size-6 rounded-full border border-border" style={{ "--swatch-color": color.hex } as CSSProperties} /></Button>)}</div>
    <div className="space-y-4">{variants.map((v, i) => <div key={v.id} className="border-b border-border pb-4 space-y-3">
      <div className="flex items-center gap-2"><span className="text-sm font-medium flex-1">Varianti {i + 1}</span>
        <Button type="button" variant="ghost" size="icon" aria-label="Lëviz lart" title="Lëviz lart" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Lëviz poshtë" title="Lëviz poshtë" disabled={i === variants.length - 1} onClick={() => move(i, i + 1)}><ArrowDown /></Button>
        <Button type="button" variant="ghost" size="icon" title="Hiq variantin" aria-label="Hiq variantin" onClick={() => onVariants(variants.filter(x => x.id !== v.id))}><Trash2 /></Button></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs space-y-1 block">Emri i variantit (SQ)<input required value={v.name_sq} className={input} onChange={e => change(v.id, { name_sq: e.target.value })} /></label>
        <label className="text-xs space-y-1 block">Emri i variantit (EN)<input value={v.name_en} className={input} onChange={e => change(v.id, { name_en: e.target.value })} /></label>
        <label className="text-xs space-y-1 block">Çmimi (€) — bosh: çmimi i produktit<input type="number" min="0" step="0.01" value={v.price ?? ""} className={input} onChange={e => change(v.id, { price: e.target.value === "" ? null : Number(e.target.value) })} /></label>
        <label className="text-xs space-y-1 block">Stoku i variantit<input required type="number" min="0" step="1" value={v.stock} className={input} onChange={e => change(v.id, { stock: Number(e.target.value) })} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={v.color_hex !== null} onChange={e => change(v.id, { color_hex: e.target.checked ? "#c0c0c0" : null })} /> Ngjyra</label>
        {v.color_hex && <input type="color" aria-label={`Ngjyra e variantit ${i + 1}`} value={v.color_hex} onChange={e => change(v.id, { color_hex: e.target.value })} className="size-9 rounded-full cursor-pointer" />}
        <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={v.active} onChange={e => change(v.id, { active: e.target.checked })} /> Aktiv</label>
        {v.image_url && <img src={v.image_url} alt={v.name_sq} className="size-12 rounded object-cover" />}
        <Button type="button" variant="outline" size="sm" disabled={uploading !== null} onClick={() => document.getElementById(`variant-photo-${v.id}`)?.click()}>{uploading === v.id ? <Loader2 className="animate-spin" /> : <ImagePlus />} Foto</Button>
        <input id={`variant-photo-${v.id}`} type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Foto e variantit ${i + 1}`} className="hidden" onChange={e => upload(v.id, e.target.files?.[0])} />
        {v.image_url && <Button type="button" variant="ghost" size="sm" onClick={() => change(v.id, { image_url: null })}>Hiq foton</Button>}
      </div>
    </div>)}</div>
  </section>;
}