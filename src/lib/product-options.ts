import type { Json, Database } from "@/integrations/supabase/types";

export type Variant = Database["public"]["Tables"]["product_variants"]["Row"];
export type Spec = { name: string; value: string };
export function readSpecs(value: Json | undefined): Spec[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).filter(([, v]) => typeof v === "string" && v.trim()).map(([name, v]) => ({ name, value: String(v) }));
}
export function optionPrice(base: number, variant?: Pick<Variant, "price"> | null) {
  return Number(variant?.price ?? base);
}
export function canBuyOption(hasVariants: boolean, variant: Pick<Variant, "stock" | "active"> | undefined, baseStock: number, qty: number) {
  if (!Number.isInteger(qty) || qty < 1 || qty > 1000) return false;
  return hasVariants ? Boolean(variant?.active && variant.stock >= qty) : baseStock >= qty;
}