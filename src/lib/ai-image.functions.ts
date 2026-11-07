import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().trim().min(2).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const roles = await Promise.all(
      (["admin", "manager", "editor"] as const).map((r) => supabase.rpc("has_role", { _user_id: userId, _role: r })),
    );
    if (!roles.some((r) => r.data === true)) throw new Error("Nuk keni leje");

    const { generateImage, GatewayError } = await import("@lovable.dev/ai-gateway");
    let b64: string | undefined;
    try {
      const res = await generateImage({
        model: "openai/gpt-image-2.5-sunburst",
        prompt: `Professional e-commerce product photo of "${data.name}" — a nail care / beauty cosmetics product. Single product centered, clean soft white background, soft studio lighting, high detail, photorealistic, no text or watermark.`,
        size: "1024x1024",
        quality: "medium",
        output_format: "jpeg",
      });
      b64 = res.data?.[0]?.b64_json;
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("AI image error", e.code, e.ids);
        if (e.code === "payment_required" || e.httpStatus === 402) throw new Error("Kreditet e AI kanë mbaruar.");
        if (e.httpStatus === 429) throw new Error("Shumë kërkesa, provoni pas pak.");
      }
      throw new Error("Gjenerimi i fotos dështoi.");
    }
    if (!b64) throw new Error("AI nuk ktheu foto.");

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `ai/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from("product-images").upload(path, bytes, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (error) throw new Error("Ruajtja dështoi: " + error.message);
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    return { url: pub.publicUrl };
  });

export const generateProductDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().trim().min(2).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const roles = await Promise.all(
      (["admin", "manager", "editor"] as const).map((r) => supabase.rpc("has_role", { _user_id: userId, _role: r })),
    );
    if (!roles.some((r) => r.data === true)) throw new Error("Nuk keni leje");

    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6.1-terra",
        instructions:
          "You write short e-commerce product descriptions for a nail care / beauty cosmetics shop in Kosovo. Return JSON only.",
        input: `Write a product description for "${data.name}" (a nail care / beauty cosmetics product). Return JSON: {"sq": "...", "en": "..."} — "sq" in Albanian, "en" in English. Each 1-2 sentences, friendly sales tone, no emojis, no prices, no invented brand claims.`,
        text: {
          format: {
            type: "json_schema",
            name: "product_description",
            strict: true,
            schema: {
              type: "object",
              properties: { sq: { type: "string" }, en: { type: "string" } },
              required: ["sq", "en"],
              additionalProperties: false,
            },
          },
        },
      });
      const r = res as { output_text?: string; output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
      const text =
        r.output_text ??
        (r.output ?? [])
          .filter((o) => o.type === "message")
          .flatMap((o) => o.content ?? [])
          .map((c) => c.text ?? "")
          .join("");
      const parsed = JSON.parse(text) as { sq?: string; en?: string };
      if (!parsed.sq || !parsed.en) throw new Error("empty");
      return { sq: parsed.sq, en: parsed.en };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("AI text error", e.code, e.httpStatus, e.message, e.ids);
        if (e.code === "payment_required" || e.httpStatus === 402) throw new Error("Kreditet e AI kanë mbaruar.");
        if (e.httpStatus === 429) throw new Error("Shumë kërkesa, provoni pas pak.");
      }
      throw new Error("Gjenerimi i përshkrimit dështoi.");
    }
  });
