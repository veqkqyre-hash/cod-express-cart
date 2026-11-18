import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Json } from "@/integrations/supabase/types";
import {
  HOME_ARRIVALS_ORDER_KEY, HOME_ARRIVALS_ORDER_QUERY_KEY,
  orderHomeArrivals, readHomeArrivalsOrder,
} from "@/lib/home-arrivals-order";

type Arrival = { id: string; name_sq: string; name_en: string; image_url: string | null };

function SortableArrival({ product, index, disabled, lang }: {
  product: Arrival; index: number; disabled: boolean; lang: string;
}) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: product.id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ${isDragging ? "z-20 shadow-xl" : ""}`}
    >
      {product.image_url ? (
        <img src={product.image_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
      ) : (
        <div className="aspect-square w-full bg-neutral-100" />
      )}
      <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-bold text-black shadow">{index + 1}</span>
      <button
        ref={setActivatorNodeRef}
        type="button"
        disabled={disabled}
        aria-label={lang === "sq" ? `Lëviz produktin ${product.name_sq}` : `Move product ${product.name_en}`}
        title={lang === "sq" ? "Mbaje dhe lëvize" : "Drag to reorder"}
        className="absolute right-2 top-2 grid h-11 w-11 touch-none place-items-center rounded-full bg-black text-white shadow-lg active:cursor-grabbing disabled:opacity-50"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <p className="min-h-[3.25rem] p-2 text-xs font-semibold leading-snug text-neutral-900 sm:p-3 sm:text-sm">
        {lang === "sq" ? product.name_sq : product.name_en}
      </p>
    </div>
  );
}

/** Only the six currently shown in the homepage 'Sapo mbërritën' section. */
export function AdminHomeArrivalsOrder() {
  const { lang } = useI18n();
  const sq = lang === "sq";
  const client = useQueryClient();
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["admin-home-arrivals-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products")
        .select("id,name_sq,name_en,image_url")
        .eq("active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as Arrival[];
    },
    staleTime: 30_000,
  });
  const savedOrderQuery = useQuery({
    queryKey: HOME_ARRIVALS_ORDER_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings")
        .select("value")
        .eq("key", HOME_ARRIVALS_ORDER_KEY)
        .maybeSingle();
      if (error) throw error;
      return readHomeArrivalsOrder(data?.value);
    },
    staleTime: 30_000,
  });
  const products = productsQuery.data ?? [];
  const sorted = orderHomeArrivals(products, draftIds ?? savedOrderQuery.data ?? []);
  const ids = sorted.map((p) => p.id);
  const busy = saving || productsQuery.isLoading || savedOrderQuery.isLoading;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDrop(event: DragEndEvent) {
    if (busy || !event.over) return;
    const from = ids.indexOf(String(event.active.id));
    const to = ids.indexOf(String(event.over.id));
    if (from >= 0 && to >= 0 && from !== to) {
      setDraftIds(arrayMove(ids, from, to));
    }
  }

  async function save() {
    if (!draftIds || busy) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("site_settings").upsert({
        key: HOME_ARRIVALS_ORDER_KEY,
        value: { ids: draftIds } as Json,
      }, { onConflict: "key" });
      if (error) throw error;
      client.setQueryData(HOME_ARRIVALS_ORDER_QUERY_KEY, draftIds);
      await client.invalidateQueries({ queryKey: HOME_ARRIVALS_ORDER_QUERY_KEY });
      setDraftIds(null);
      toast.success(sq ? "Renditja në ballinë u ruajt" : "Homepage product order saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (sq ? "Nuk u ruajt" : "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 sm:p-6">
      <h3 className="font-display text-xl font-semibold">
        {sq ? "Lëviz produktet te «Sapo mbërritën»" : "Reorder the «New arrivals» products"}
      </h3>
      <p className="mb-4 mt-1 text-sm text-neutral-600">
        {sq
          ? "Mbaje ikonën ⠿ dhe tërhiqe produktin në vendin që don. Ndryshon vetëm renditja e këtyre 6 kartelave në ballinë; çmimet dhe dyqani nuk preken."
          : "Hold the ⠿ handle and drag the product to a new spot. Only the six homepage cards are reordered; prices and shop listings are unchanged."}
      </p>
      {productsQuery.isError || savedOrderQuery.isError ? (
        <p role="alert" className="text-sm text-red-700">
          {sq ? "Nuk u ngarkuan produktet. Rifresko faqen." : "Could not load products. Refresh the page."}
        </p>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500">{sq ? "Nuk ka produkte aktive në stok." : "No in-stock products."}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDrop}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {sorted.map((product, index) => (
                <SortableArrival key={product.id} product={product} index={index} disabled={busy} lang={lang} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={busy || !draftIds} onClick={save}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
          <Save className="h-4 w-4" /> {saving ? (sq ? "Duke ruajtur…" : "Saving…") : (sq ? "Ruaj renditjen" : "Save order")}
        </button>
        <button type="button" disabled={busy} onClick={() => setDraftIds(products.map(p => p.id))}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-40">
          <RotateCcw className="h-4 w-4" /> {sq ? "Kthe si më parë" : "Reset order"}
        </button>
        {draftIds && <span className="self-center text-xs text-neutral-600">
          {sq ? "Shtyp Ruaj renditjen që të shfaqet në website." : "Press Save order to update the website."}
        </span>}
      </div>
    </section>
  );
}
