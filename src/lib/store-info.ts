// Të dhënat e biznesit (site_settings key "store") — përdoren në fatura POS.
import { supabase } from "@/integrations/supabase/client";

export type BusinessInfo = {
  business_name: string;
  nui: string;
  vat_number: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo_url: string;
};

export const STORE_SETTINGS_KEY = "store";
const CACHE_KEY = "dbc-business-info";

const DEFAULTS: BusinessInfo = {
  business_name: "Dreame Beauty Cosmetics L.L.C.",
  nui: "",
  vat_number: "",
  address: "Rr. Nëna Terezë",
  city: "Fushë Kosovë 12000, Kosovë",
  phone: "",
  email: "info@dreamebeautycosmetics.com",
  logo_url: "",
};

let cache: BusinessInfo | null = null;

function normalize(v: Record<string, unknown> | null | undefined): BusinessInfo {
  const s = (k: string, fallback = "") => String((v?.[k] as string | undefined) ?? fallback);
  return {
    business_name: s("business_name") || s("store_name") || DEFAULTS.business_name,
    nui: s("nui"),
    vat_number: s("vat_number"),
    address: s("address", DEFAULTS.address),
    city: s("city", DEFAULTS.city),
    phone: s("phone"),
    email: s("email"),
    logo_url: s("logo_url"),
  };
}

/** Sinkron — për printim faturash. Lexon cache-in e ruajtur më parë. */
export function businessInfo(): BusinessInfo {
  if (cache) return cache;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) {
        cache = normalize(JSON.parse(raw) as Record<string, unknown>);
        return cache;
      }
    } catch {
      /* ignore */
    }
  }
  return DEFAULTS;
}

/** Ngarko nga databaza dhe ruaj në cache (thirre në mount të panelit). */
export async function loadBusinessInfo(): Promise<BusinessInfo> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", STORE_SETTINGS_KEY)
      .maybeSingle();
    const value = (data?.value ?? {}) as Record<string, unknown>;
    cache = normalize(value);
    if (typeof window !== "undefined") window.localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    /* offline — mbaj cache-in aktual */
  }
  return businessInfo();
}
