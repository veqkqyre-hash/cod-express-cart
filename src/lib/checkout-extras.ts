import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ShippingRate = { id: string; zone: string; fee: number; free_over: number | null };
export type Coupon = { code: string; discount_type: string; discount_value: number; min_order: number };

/** Active shipping rate resolved by city name (falls back to the cheapest/default zone). */
export function useShipping(city: string, subtotal: number) {
  const [rates, setRates] = useState<ShippingRate[]>([]);

  useEffect(() => {
    supabase
      .from("shipping_rates")
      .select("id,zone,fee,free_over")
      .eq("active", true)
      .order("fee")
      .then(({ data }) => setRates((data ?? []) as ShippingRate[]));
  }, []);

  const c = city.trim().toLowerCase();
  const match =
    rates.find((r) => c && r.zone.toLowerCase() === c) ??
    rates.find((r) => c && (c.includes(r.zone.toLowerCase()) || r.zone.toLowerCase().includes(c))) ??
    rates[0] ??
    null;

  const base = match ? Number(match.fee) : 0;
  const freeOver = match?.free_over != null ? Number(match.free_over) : 50;
  const isFree = subtotal >= freeOver;

  return { rates, zone: match?.zone ?? null, fee: isFree ? 0 : base, freeOver, isFree };
}

/** Validates a coupon code against the active coupons table. */
export async function validateCoupon(code: string, subtotal: number) {
  const clean = code.trim().toUpperCase();
  if (!clean) return { error: "empty" as const };
  const { data, error } = await supabase
    .from("coupons")
    .select("code,discount_type,discount_value,min_order,expires_at,active")
    .eq("active", true)
    .ilike("code", clean)
    .maybeSingle();
  if (error) return { error: "invalid" as const };
  if (!data) return { error: "invalid" as const };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { error: "expired" as const };
  if (subtotal < Number(data.min_order || 0)) return { error: "min" as const, min: Number(data.min_order) };
  const discount =
    data.discount_type === "percent"
      ? (subtotal * Number(data.discount_value)) / 100
      : Number(data.discount_value);
  return { coupon: { code: data.code, discount: Math.min(discount, subtotal) } };
}
