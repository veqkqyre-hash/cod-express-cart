import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, Loader2, Sparkles, X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { aiImageToStorage } from "@/lib/cf-ai";

/** Galeria e produktit: shumë foto nga kompjuteri ose AI, me renditje. Fotoja e parë = kryesore. */
export function GalleryField({ lang, initial, getName }: { lang: string; initial: string[]; getName: () => string }) {
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    const added: string[] = [];
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name}: ${L("mbi 10 MB", "over 10 MB")}`); continue; }
      const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, f, { cacheControl: "31536000" });
      if (error) { toast.error(error.message); continue; }
      added.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    setUrls((u) => [...u, ...added]);
    setBusy(false);
    if (added.length) toast.success(L(`${added.length} foto u ngarkuan`, `${added.length} photos uploaded`));
    if (ref.current) ref.current.value = "";
  }

  async function onAi() {
    const name = getName().trim();
    if (name.length < 2) { toast.error(L("Shkruani emrin e produktit fillimisht", "Enter the product name first")); return; }
    setAiBusy(true);
    try {
      const url = await aiImageToStorage(name);
      setUrls((u) => [...u, url]);
      toast.success(L("Fotoja u gjenerua me AI", "AI image generated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setAiBusy(false); }
  }

  const move = (i: number, d: number) => setUrls((u) => {
    const j = i + d; if (j < 0 || j >= u.length) return u;
    const c = [...u]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{L("Fotot e produktit (galeria)", "Product photos (gallery)")}</label>
      <input type="hidden" name="gallery_json" value={JSON.stringify(urls)} />
      <input type="hidden" name="gallery_touched" value={removed ? "1" : "0"} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {urls.map((u, i) => (
          <div key={u + i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            <img src={u} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground"><Star className="h-3 w-3" />{L("Kryesore", "Main")}</span>}
            <button type="button" onClick={() => { setRemoved(true); setUrls((x) => x.filter((_, k) => k !== i)); }} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 shadow"><X className="h-3 w-3" /></button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="grid h-6 w-6 place-items-center rounded-full bg-background/90 shadow disabled:opacity-30"><ChevronLeft className="h-3 w-3" /></button>
              <button type="button" disabled={i === urls.length - 1} onClick={() => move(i, 1)} className="grid h-6 w-6 place-items-center rounded-full bg-background/90 shadow disabled:opacity-30"><ChevronRight className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        {!urls.length && <div className="col-span-3 grid aspect-[3/1] place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground sm:col-span-5">{L("Asnjë foto ende", "No photos yet")}</div>}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{L("Ngarko foto nga kompjuteri", "Upload from computer")}
        </button>
        <button type="button" disabled={aiBusy} onClick={onAi} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{aiBusy ? L("Duke gjeneruar… (~30s)", "Generating… (~30s)") : L("Gjenero foto me AI nga emri", "Generate with AI from name")}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{L("Fotoja e parë shfaqet si kryesore. Përdorni shigjetat për renditje.", "First photo is the main one. Use arrows to reorder.")}</p>
    </div>
  );
}
