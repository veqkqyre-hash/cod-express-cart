import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";

type AdminRow = { user_id: string; email: string; created_at: string };

export function AdminsPanel() {
  const { tr, lang } = useI18n();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: admins, refetch } = useQuery({
    queryKey: ["admins-list"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_admins");
      if (error) throw error;
      return (data ?? []) as AdminRow[];
    },
  });

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("grant_admin_by_email", { _email: email.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(tr("adminAdded"));
    setEmail("");
    refetch();
    qc.invalidateQueries({ queryKey: ["admins-list"] });
  }

  async function revoke(user_id: string) {
    if (!confirm(tr("deleteConfirm"))) return;
    const { error } = await supabase.rpc("revoke_admin", { _user_id: user_id });
    if (error) return toast.error(error.message);
    toast.success(tr("adminRemoved"));
    refetch();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addAdmin} className="flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <input
          type="email"
          required
          placeholder={tr("adminEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-w-56 rounded-full border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> {tr("addAdmin")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 hidden sm:table-cell">{lang === "sq" ? "Që nga" : "Since"}</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {admins?.map((a) => (
              <tr key={a.user_id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{a.email}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => revoke(a.user_id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {tr("revoke")}
                  </button>
                </td>
              </tr>
            ))}
            {admins && admins.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">—</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
