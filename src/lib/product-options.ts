import type { Json, Database } from "@/integrations/supabase/types";

export type Variant = Database["public"]["Tables"]["product_variants"]["Row"];
export type Spec = { name: string; value: string };
export const variantColors = [
  { name: "Pink", hex: "#ffc0cb" }, { name: "Orange", hex: "#ffa500" },
  { name: "Purple", hex: "#800080" }, { name: "Blue", hex: "#0000ff" },
  { name: "White", hex: "#ffffff" }, { name: "Black", hex: "#000000" },
];
export function incompleteSpecs(specs: Spec[]) {
  return specs.some(s => Boolean(s.name.trim()) !== Boolean(s.value.trim()));
}
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
/** Manual per-product sale: applies only when the admin activated it with 1–100%. Mirrors public.discounted_price in the database. */
export function discountPercent(p: { discount_active?: boolean | null; discount_percent?: number | null }) {
  const pct = Number(p.discount_percent ?? 0);
  return p.discount_active && pct > 0 ? Math.min(pct, 100) : 0;
}
export function salePrice(base: number, p: { discount_active?: boolean | null; discount_percent?: number | null }) {
  const pct = discountPercent(p);
  return pct ? Math.round(base * (100 - pct)) / 100 : Number(base);
}
