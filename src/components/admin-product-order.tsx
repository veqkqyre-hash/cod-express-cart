import { useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { applyAdminOrder, reorderFullList } from "@/lib/admin-product-order";
import { toast } from "sonner";

export function useAdminOrderedProducts() {
  const client = useQueryClient();
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const query = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const products: Tables<"products">[] = [];
      for (let start = 0; ; start += 1000) {
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }).order("id").range(start, start + 999);
        if (error) throw error;
        products.push(...(data ?? []));
        if ((data?.length ?? 0) < 1000) break;
      }
      const { data, error } = await supabase.from("admin_product_order").select("product_ids").eq("singleton", true).maybeSingle();
      if (error) throw error;
      return applyAdminOrder(products, data?.product_ids ?? []);
    },
  });
  async function reorder(event: DragEndEvent, visibleIds: string[], filtered = false) {
    if (busy.current || !event.over || !query.data || query.isFetching) return;
    const ids = query.data.map(p => p.id);
    const next = reorderFullList(ids, visibleIds, String(event.active.id), String(event.over.id), filtered);
    if (!next) return;
    busy.current = true;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_admin_product_order", { _ids: next, _expected_ids: ids });
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Renditja u ruajt");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Renditja nuk u ruajt. Rifreskojeni listën.");
      await client.invalidateQueries({ queryKey: ["admin-products"] });
    } finally { busy.current = false; setSaving(false); }
  }
  return { ...query, saving, reorder };
}

export function ProductOrderContext({ ids, onDragEnd, children }: { ids: string[]; onDragEnd: (event: DragEndEvent) => void; children: ReactNode }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={ids} strategy={verticalListSortingStrategy}>{children}</SortableContext></DndContext>;
}

export function SortableProductRow({ id, name, disabled, className, children }: { id: string; name: string; disabled: boolean; className: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return <tr ref={setNodeRef} data-product-id={id} className={`${className} ${isDragging ? "relative z-10 bg-accent shadow-soft" : ""}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
    <td className="w-12 px-2 py-2"><Button ref={setActivatorNodeRef} variant="ghost" size="icon" disabled={disabled} aria-label={`Rendit ${name}`} title={disabled ? "Renditja nuk është e disponueshme në këtë pamje" : `Rendit ${name}`} className="touch-none cursor-grab text-foreground active:cursor-grabbing" {...attributes} {...listeners}><span aria-hidden="true" className="text-xl">⠿</span></Button></td>
    {children}
  </tr>;
}