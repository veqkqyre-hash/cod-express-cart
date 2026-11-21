/** Fixed delivery rules, mirrored by the Supabase shipping_fee_by_country RPC.
 * The SQL version is authoritative for checkout and must be deployed first.
 */
export type DeliveryCountry = "XK" | "AL" | "MK";

export const DELIVERY_COUNTRIES: ReadonlyArray<{ code: DeliveryCountry; sq: string; en: string; de: string; fr: string }> = [
  { code: "XK", sq: "Kosovë", en: "Kosovo", de: "Kosovo", fr: "Kosovo" },
  { code: "AL", sq: "Shqipëri", en: "Albania", de: "Albanien", fr: "Albanie" },
  { code: "MK", sq: "Maqedoni e Veriut", en: "North Macedonia", de: "Nordmazedonien", fr: "Macédoine du Nord" },
];

export const KOSOVO_FREE_SHIPPING_FROM = 50;
export const KOSOVO_SHIPPING_FEE = 2;
export const INTERNATIONAL_SHIPPING_FEE = 5;

export function shippingForCountry(country: DeliveryCountry, subtotal: number) {
  const isKosovo = country === "XK";
  const isFree = isKosovo && subtotal >= KOSOVO_FREE_SHIPPING_FROM;
  return {
    fee: isKosovo ? (isFree ? 0 : KOSOVO_SHIPPING_FEE) : INTERNATIONAL_SHIPPING_FEE,
    freeOver: isKosovo ? KOSOVO_FREE_SHIPPING_FROM : null,
    isFree,
  };
}
