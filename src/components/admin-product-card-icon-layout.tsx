import { useRef, useState, type PointerEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, Move, RotateCcw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Json } from "@/integrations/supabase/types";
import {
  actionPointStyle, DEFAULT_PRODUCT_CARD_ICON_LAYOUT,
  PRODUCT_CARD_ICON_QUERY_KEY, PRODUCT_CARD_ICON_SETTINGS_KEY,
  parseProductCardIconLayout,
  type ActionIconName, type ProductCardIconLayout,
} from "@/lib/product-card-icon-layout";

/** Admin-only editor: drag each control over a product image, then save
 *  normalized coordinates for all public product cards. */
export function AdminProductCardIconLayout({ sampleImage }: { sampleImage?: string | null }) {
  const { lang } = useI18n();
  const isSq = lang === "sq";
  const client = useQueryClient();
  const { data: stored, isLoading } = useQuery({
    queryKey: PRODUCT_CARD_ICON_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings")
        .select("value").eq("key", PRODUCT_CARD_ICON_SETTINGS_KEY).maybeSingle();
      if (error) throw error;
      return parseProductCardIconLayout(data?.value);
    },
    staleTime: 30_000,
  });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [layout, setLayout] = useState<ProductCardIconLayout>(DEFAULT_PRODUCT_CARD_ICON_LAYOUT);
  const board = useRef<HTMLDivElement>(null);
  const dragging = useRef<ActionIconName | null>(null);

  function openEditor() {
    setLayout(parseProductCardIconLayout(stored));
    setOpen(true);
  }

  function move(key: ActionIconName, event: PointerEvent<HTMLButtonElement>) {
    if (dragging.current !== key || !board.current) return;
    const bounds = board.current.getBoundingClientRect();
    const box = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    // Keep the entire control inside the image, also on touch screens.
    const minX = (box.width / 2 + 5) / bounds.width * 100;
    const minY = (box.height / 2 + 5) / bounds.height * 100;
    const x = Math.max(minX, Math.min(100 - minX, (event.clientX - bounds.left) / bounds.width * 100));
    const y = Math.max(minY, Math.min(100 - minY, (event.clientY - bounds.top) / bounds.height * 100));
    setLayout(previous => ({ ...previous, [key]: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } }));
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({
      key: PRODUCT_CARD_ICON_SETTINGS_KEY,
      value: layout as unknown as Json,
    }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    client.setQueryData(PRODUCT_CARD_ICON_QUERY_KEY, layout);
    await client.invalidateQueries({ queryKey: PRODUCT_CARD_ICON_QUERY_KEY });
    toast.success(isSq ? "Pozicionet e ikonave u ruajtën" : "Icon positions saved");
    setOpen(false);
  }

  const icons: { key: ActionIconName; label: string }[] = [
    { key: "wishlist", label: isSq ? "Zemra" : "Wishlist" },
    { key: "quickView", label: isSq ? "Shiko" : "Preview" },
    { key: "addToCart", label: isSq ? "Shto në shportë" : "Add to cart" },
  ];

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{isSq ? "Lëviz ikonat e kartelave të produkteve" : "Move product-card action icons"}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isSq ? "Zemra, syri dhe butoni i shportës. Ndryshimi vlen për të gjitha produktet në website." : "Wishlist, preview and cart buttons. Changes apply to product cards across the website."}
          </p>
        </div>
        <button type="button" disabled={isLoading} onClick={() => open ? setOpen(false) : openEditor()}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50">
          <Move className="h-4 w-4" />
          {open ? (isSq ? "Mbyll" : "Close") : (isSq ? "Rregullo pozicionet" : "Edit positions")}
        </button>
      </div>

      {open && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-3 text-sm">
            {isSq
              ? "Mbaje ikonën me maus ose gisht, tërhiqe brenda fotos dhe shtyp Ruaj. Klientët nuk mund t'i lëvizin."
              : "Drag an icon within the photo with your mouse or finger, then Save. Customers cannot move them."}
          </p>
          <div ref={board} className="relative aspect-square w-full max-w-[380px] touch-none select-none overflow-hidden rounded-xl border border-border bg-neutral-100">
            {sampleImage && <img src={sampleImage} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />}
            {icons.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-label={label}
                title={label}
                style={actionPointStyle(layout[key])}
                className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 touch-none select-none items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white text-black shadow-lg active:cursor-grabbing ${key === "addToCart" ? "min-h-10 max-w-[92%] px-4 py-2 text-xs font-semibold" : "h-11 w-11 cursor-grab"}`}
                onPointerDown={(event) => {
                  if (saving) return;
                  dragging.current = key;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  event.preventDefault();
                }}
                onPointerMove={(event) => move(key, event)}
                onPointerUp={(event) => {
                  move(key, event);
                  dragging.current = null;
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={() => { dragging.current = null; }}
              >
                {key === "wishlist" ? <Heart className="h-4 w-4" /> :
                  key === "quickView" ? <Eye className="h-4 w-4" /> :
                    <><ShoppingBag className="h-4 w-4" /><span>{label}</span></>}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={saving}
              className="min-h-10 rounded-full bg-[var(--pink-deep)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? (isSq ? "Duke ruajtur…" : "Saving…") : (isSq ? "Ruaj pozicionet" : "Save positions")}
            </button>
            <button type="button" disabled={saving} onClick={() => setLayout(DEFAULT_PRODUCT_CARD_ICON_LAYOUT)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm">
              <RotateCcw className="h-4 w-4" /> {isSq ? "Kthe si më parë" : "Reset positions"}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {isSq ? "Pozicionet ruhen për të gjithë klientët; përmasat përshtaten automatikisht në telefon dhe kompjuter." : "Saved positions are shared with shoppers and adapt to phone and desktop sizes."}
          </p>
        </div>
      )}
    </div>
  );
}
