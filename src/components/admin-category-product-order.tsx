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
  categoryProductOrderKey, categoryProductOrderQueryKey,
  readCategoryProductOrder, sortCategoryProducts,
} from "@/lib/category-product-order";

type CategoryOption = { id: string; slug: string; name_sq: string; name_en: string };
type ProductPreview = { id: string; name_sq: string; name_en: string; image_url: string | null };

function SortableCategoryProduct({ product, position, lang, disabled }: {
  product: ProductPreview; position: number; lang: string; disabled: boolean;
}) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: product.id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-sm ${isDragging ? "z-20 shadow-xl" : ""}`}
    >
      {product.image_url ? (
        <img src={product.image_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
      ) : (
        <div className="aspect-square w-full bg-neutral-100" />
      )}
      <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-bold text-black shadow">
        {position}
      </span>
      <button
        ref={setActivatorNodeRef}
        type="button"
        disabled={disabled}
        aria-label={lang === "sq" ? `Lëviz produktin ${product.name_sq}` : `Move product ${product.name_en}`}
        title={lang === "sq" ? "Mbaje dhe tërhiqe" : "Hold and drag"}
        className="absolute right-2 top-2 grid h-11 w-11 touch-none select-none place-items-center rounded-full bg-black text-white shadow-lg active:cursor-grabbing disabled:opacity-40"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <p className="min-h-[3.25rem] p-2 text-xs font-semibold leading-snug sm:p-3 sm:text-sm">
        {lang === "sq" ? product.name_sq : product.name_en}
      </p>
    </div>
  );
}

/** Reorder the visible product cards in each category independently.
 * Uses admin-only site_settings writes and public read-only preferences. */
export function AdminCategoryProductOrder({ categories }: { categories: CategoryOption[] }) {
  const { lang } = useI18n();
  const sq = lang === "sq";
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const categoryId = categories.some(c => c.id === selectedId) ? selectedId : categories[0]?.id ?? "";
  const selectedCategory = categories.find(c => c.id === categoryId);

  const productQuery = useQuery({
    queryKey: ["admin-category-product-order-products", categoryId],
    enabled: Boolean(categoryId),
    queryFn: async () => {
      const result: ProductPreview[] = [];
      // Supabase defaults to a 1,000-row limit. Fetch all pages so an admin
      // can also move products outside the first page to the first position.
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("products")
          .select("id,name_sq,name_en,image_url")
          .eq("category_id", categoryId)
          .eq("active", true)
          .gt("stock", 0)
          .order("created_at", { ascending: false })
          .order("id")
          .range(from, from + 999);
        if (error) throw error;
        result.push(...((data ?? []) as ProductPreview[]));
        if ((data?.length ?? 0) < 1000) break;
      }
      return result;
    },
    staleTime: 30_000,
  });

  const orderQuery = useQuery({
    queryKey: categoryProductOrderQueryKey(categoryId),
    enabled: Boolean(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings")
        .select("value")
        .eq("key", categoryProductOrderKey(categoryId))
        .maybeSingle();
      if (error) throw error;
      return readCategoryProductOrder(data?.value);
    },
    staleTime: 30_000,
  });

  const products = productQuery.data ?? [];
  const ordered = sortCategoryProducts(products, draftIds ?? orderQuery.data ?? []);
  const visibleIds = ordered.map(product => product.id);
  const busy = saving || productQuery.isFetching || orderQuery.isFetching;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDrop(event: DragEndEvent) {
    if (busy || !event.over) return;
    const from = visibleIds.indexOf(String(event.active.id));
    const to = visibleIds.indexOf(String(event.over.id));
    if (from >= 0 && to >= 0 && from !== to) {
      setDraftIds(arrayMove(visibleIds, from, to));
    }
  }

  async function saveOrder() {
    if (!categoryId || !draftIds || busy) return;
    // Ensure a draft is a permutation of the currently displayed products.
    if (draftIds.length !== products.length ||
        new Set(draftIds).size !== products.length ||
        draftIds.some(id => !products.some(p => p.id === id))) {
      toast.error(sq ? "Lista ka ndryshuar. Rifresko dhe provo përsëri." : "Products changed. Refresh and try again.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("site_settings").upsert({
        key: categoryProductOrderKey(categoryId),
        value: { ids: draftIds } as Json,
      }, { onConflict: "key" });
      if (error) throw error;
      queryClient.setQueryData(categoryProductOrderQueryKey(categoryId), draftIds);
      await queryClient.invalidateQueries({ queryKey: categoryProductOrderQueryKey(categoryId) });
      setDraftIds(null);
      toast.success(sq ? "Renditja e kategorisë u ruajt në website" : "Category order saved to website");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (sq ? "Nuk u ruajt renditja" : "Could not save order"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 sm:p-6">
      <h3 className="font-display text-xl font-semibold">
        {sq ? "Lëviz produktet brenda kategorisë" : "Reorder products within a category"}
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        {sq
          ? "Zgjedhe një kategori (p.sh. Lampa UV/LED), kap shenjën ⠿ te produkti dhe tërhiqe ku don. Kështu e zgjedh cilën foto me e lanë të parën."
          : "Choose a category (e.g. UV/LED Lamps), grab the ⠿ handle and drag a product where you want it. Put any product image first."}
      </p>
      <label htmlFor="admin-shop-category-order" className="mt-4 block text-sm font-semibold">
        {sq ? "Zgjedh kategorinë" : "Choose category"}
      </label>
      <select
        id="admin-shop-category-order"
        value={categoryId}
        onChange={(event) => { setSelectedId(event.target.value); setDraftIds(null); }}
        disabled={saving || categories.length === 0}
        className="mt-2 w-full max-w-md rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900"
      >
        {categories.length === 0 && <option value="">{sq ? "Nuk ka kategori" : "No categories"}</option>}
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {lang === "sq" ? category.name_sq : category.name_en}
          </option>
        ))}
      </select>
      {selectedCategory && (
        <p className="mt-2 text-xs text-neutral-600">
          {sq ? "Duke renditur" : "Reordering"}: {lang === "sq" ? selectedCategory.name_sq : selectedCategory.name_en}
          {" · "}{products.length} {sq ? "produkte aktive në stok" : "active in-stock products"}
        </p>
      )}
      {productQuery.isError || orderQuery.isError ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {sq ? "Nuk u ngarkua renditja. Rifresko faqen." : "Could not load order. Refresh the page."}
        </p>
      ) : busy && !products.length ? (
        <p className="mt-4 text-sm text-neutral-500">{sq ? "Duke ngarkuar…" : "Loading…"}</p>
      ) : products.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          {sq ? "Nuk ka produkte aktive në stok në këtë kategori." : "No active in-stock products in this category."}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDrop}>
          <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {ordered.map((product, index) => (
                <SortableCategoryProduct
                  key={product.id}
                  product={product}
                  position={index + 1}
                  disabled={busy}
                  lang={lang}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !draftIds}
          onClick={saveOrder}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          {saving ? (sq ? "Duke ruajtur…" : "Saving…") : (sq ? "Ruaj renditjen" : "Save order")}
        </button>
        <button
          type="button"
          disabled={busy || products.length === 0}
          onClick={() => setDraftIds(products.map(p => p.id))}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
          {sq ? "Kthe si më parë" : "Reset order"}
        </button>
        {draftIds && (
          <span className="self-center text-xs text-neutral-600">
            {sq ? "Shtyp Ruaj renditjen që të dalë në website." : "Save the order to update the website."}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        {sq
          ? "Ndryshon vetëm renditja e produkteve të kësaj kategorie, jo çmimi, stoku, fotografia ose renditja e kategorive tjera."
          : "Only this category's product positions change, not prices, stock, photos or other categories."}
      </p>
    </section>
  );
}
