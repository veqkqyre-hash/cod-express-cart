import { supabase } from "@/integrations/supabase/client";
import { readSeo } from "./seo-data";
import { getPageSeo } from "./seo.functions";

// cPanel is static HTML/PHP: client navigation uses the existing public Data API,
// never a Worker RPC that is unavailable on that host.
export function loadSeo(path: string) {
  return typeof window === "undefined" ? getPageSeo({ data: { path } }) : readSeo(supabase, path);
}