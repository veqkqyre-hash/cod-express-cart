import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps the storefront and the admin/POS in sync with the single `products`
 * table: any insert/update/delete made in the admin (name, price, image,
 * stock, active) invalidates every product-related query instantly.
 */
export function ProductSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const topic = `products-sync-${Math.random().toString(36).slice(2)}`;
    const ch = supabase
      .channel(topic)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        for (const key of [
          ["products"],
          ["product"],
          ["home-featured"],
          ["home-new"],
          ["home-best"],
          ["pos-products"],
          ["admin-products"],
          ["inventory"],
        ]) {
          qc.invalidateQueries({ queryKey: key });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return null;
}
