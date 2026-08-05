import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Not authorized");
}

export const listRegisteredUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr || isAdmin !== true) throw new Error("Not authorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);

    const ids = data.users.map((u) => u.id);
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("user_id,total")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    return data.users.map((u) => {
      const mine = (orders ?? []).filter((o) => o.user_id === u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        confirmed: Boolean(u.email_confirmed_at),
        orders: mine.length,
        total: mine.reduce((s, o) => s + Number(o.total || 0), 0),
      };
    });
  });

export const deleteRegisteredUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr || isAdmin !== true) throw new Error("Not authorized");
    if (data.userId === context.userId) throw new Error("Cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
