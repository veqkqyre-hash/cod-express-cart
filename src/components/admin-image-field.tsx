import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";

/** Image field: upload from computer (stored in product-images bucket) or paste a URL. */
export function ImageUploadField({ label, name, defaultValue, folder }: { label: string; name: string; defaultValue?: string | null; folder: string }) {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error(L("Zgjidhni një foto", "Choose an image"));
    if (file.size > 5 * 1024 * 1024) return toast.error(L("Fotoja duhet nën 5MB", "Image must be under 5MB"));
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "31536000" });
    setBusy(false);
    if (ref.current) ref.current.value = "";
    if (error) return toast.error(error.message);
    setUrl(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    toast.success(L("Fotoja u ngarkua", "Image uploaded"));
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        {url ? (
          <div className="relative">
            <img src={url} alt="" className="h-16 w-16 rounded-lg border object-cover" />
            <button type="button" onClick={() => setUrl("")} className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 shadow" aria-label={L("Hiq foton", "Remove image")}><X className="h-3.5 w-3.5" /></button>
          </div>
        ) : null}
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm hover:bg-muted disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? L("Duke ngarkuar…", "Uploading…") : L("Ngarko nga kompjuteri", "Upload from computer")}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={L("ose ngjitni URL", "or paste URL")} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2 text-xs" />
    </div>
  );
}
