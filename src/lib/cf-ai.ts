import { supabase } from "@/integrations/supabase/client";

/** Cloudflare Workers AI (falas). Thirret direkt nga shfletuesi — punon edhe në cPanel statik. */
export const CF_AI_URL = "https://dreame-beauty-ai.radiowebstarch.workers.dev";

async function call<T>(path: string, name: string): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Hyni si administrator për të përdorur AI.");
  let res: Response;
  try {
    res = await fetch(`${CF_AI_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  } catch {
    throw new Error("Shërbimi AI nuk u arrit. Provoni nga dreamebeautycosmetics.com.");
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(aiErrorMessage(res.status, String(body.error ?? "")));
  return body as T;
}

export function aiErrorMessage(status: number, msg: string): string {
  if (status === 429 || /quota|limit|neuron|exceed/i.test(msg))
    return "Kuota falas e AI për sot ka mbaruar. Provoni përsëri nesër.";
  if (status === 401 || status === 403) return msg || "Nuk keni leje për AI (vetëm Admin, Manager ose Editor).";
  return msg || `Gjenerimi dështoi (${status}).`;
}

export async function aiDescription(name: string) {
  const r = await call<{ sq?: string; en?: string }>("/generate-description", name);
  if (!r.sq || !r.en) throw new Error("AI nuk ktheu përshkrim të plotë.");
  return { sq: r.sq, en: r.en };
}

export async function aiImageToStorage(name: string): Promise<string> {
  const r = await call<{ image?: string; mimeType?: string }>("/generate-image", name);
  if (!r.image) throw new Error("AI nuk ktheu foto.");
  const mime = r.mimeType || "image/png";
  const bin = atob(r.image.replace(/^data:[^,]+,/, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = mime.includes("jpeg") ? "jpg" : mime.split("/")[1] || "png";
  const path = `ai/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("product-images")
    .upload(path, new Blob([bytes], { type: mime }), { contentType: mime, cacheControl: "31536000" });
  if (error) throw new Error(`Ruajtja e fotos dështoi: ${error.message}`);
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}
