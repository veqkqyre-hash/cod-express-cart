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
