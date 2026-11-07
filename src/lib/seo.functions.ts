import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readSeo } from "./seo-data";

export const getPageSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { path: string }) => {
    if (!data.path.startsWith("/") || data.path.startsWith("//") || data.path.length > 500) throw new Error("Invalid page");
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    return readSeo(client, data.path);
  });