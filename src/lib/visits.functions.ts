import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const InputSchema = z.object({
  path: z.string().max(500).default("/"),
  referrer: z.string().max(500).optional().nullable(),
  language: z.string().max(40).optional().nullable(),
  sessionId: z.string().max(80).optional().nullable(),
});

function deviceFromUa(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "Tablet";
  if (/mobile|iphone|android/.test(s)) return "Mobile";
  if (!ua) return "Unknown";
  return "Desktop";
}

/** Records an anonymous page visit with IP + country resolved server-side. */
export const logVisit = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const req = getRequest();
    const h = req.headers;
    const ip =
      (h.get("cf-connecting-ip") ||
        h.get("x-real-ip") ||
        (h.get("x-forwarded-for") ?? "").split(",")[0] ||
        "").trim() || null;

    let country = h.get("cf-ipcountry-name") || null;
    let countryCode = h.get("cf-ipcountry") || h.get("x-vercel-ip-country") || null;
    let city = h.get("cf-ipcity") || h.get("x-vercel-ip-city") || null;
    let region = h.get("cf-region") || h.get("x-vercel-ip-country-region") || null;

    if (ip && (!countryCode || countryCode === "XX" || !city)) {
      try {
        const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
        if (res.ok) {
          const geo = (await res.json()) as {
            success?: boolean; country?: string; country_code?: string; city?: string; region?: string;
          };
          if (geo.success !== false) {
            country = country ?? geo.country ?? null;
            countryCode = countryCode && countryCode !== "XX" ? countryCode : (geo.country_code ?? null);
            city = city ?? geo.city ?? null;
            region = region ?? geo.region ?? null;
          }
        }
      } catch {
        // geo lookup is best-effort
      }
    }

    const ua = h.get("user-agent") ?? "";
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    await supabase.from("visitor_logs").insert({
      path: data.path,
      referrer: data.referrer ?? null,
      language: data.language ?? null,
      session_id: data.sessionId ?? null,
      ip,
      country,
      country_code: countryCode,
      city,
      region,
      user_agent: ua.slice(0, 400),
      device: deviceFromUa(ua),
    });

    return { ok: true };
  });
