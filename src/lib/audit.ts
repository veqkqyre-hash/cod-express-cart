import { supabase } from "@/integrations/supabase/client";

/** Fire-and-forget audit trail entry for admin actions. */
export async function logAction(
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>,
) {
  try {
    await supabase.rpc("log_action", {
      _action: action,
      _entity: entity,
      _entity_id: entityId ?? "",
      _details: (details ?? {}) as never,
    });
  } catch {
    // never block the UI on logging
  }
}
