import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { UserPlus, Trash2, ShieldCheck, ClipboardList, PenLine } from "lucide-react";

type StaffRole = "admin" | "manager" | "editor";
type StaffRow = { user_id: string; email: string; role: StaffRole; created_at: string };

const ROLE_META: Record<StaffRole, { icon: any; tone: string }> = {
  admin: { icon: ShieldCheck, tone: "bg-pink-50 text-pink-700" },
  manager: { icon: ClipboardList, tone: "bg-blue-50 text-blue-700" },
  editor: { icon: PenLine, tone: "bg-amber-50 text-amber-700" },
};

export function AdminsPanel() {
  const { tr, lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("admin");
  const [busy, setBusy] = useState(false);

  const roleLabel: Record<StaffRole, string> = {
    admin: L("Admin (akses i plotë)", "Admin (full access)"),
    manager: L("Menaxher (porosi, inventar)", "Manager (orders, inventory)"),
    editor: L("Editor (përmbajtja)", "Editor (content)"),
  };

  const { data: staff, refetch } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_staff");
      if (error) throw error;
      return (data ?? []) as StaffRow[];
    },
  });

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("grant_role_by_email", { _email: email.trim(), _role: role });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(L("Roli u caktua", "Role granted"));
    setEmail("");
    refetch();
  }

  async function revoke(row: StaffRow) {
    if (!confirm(tr("deleteConfirm"))) return;
    const { error } = await supabase.rpc("revoke_role", { _user_id: row.user_id, _role: row.role });
    if (error) return toast.error(error.message);
    toast.success(L("Roli u hoq", "Role removed"));
    refetch();
  }

  const inputCls = "rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(ROLE_META) as StaffRole[]).map((r) => {
          const Icon = ROLE_META[r].icon;
          return (
            <div key={r} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_META[r].tone}`}>
                <Icon className="h-3.5 w-3.5" /> {r}
              </div>
              <p className="mt-2 text-xs text-neutral-500">{roleLabel[r]}</p>
              <div className="mt-2 text-sm font-medium">
                {(staff ?? []).filter((s) => s.role === r).length} {L("persona", "people")}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={addStaff} className="flex flex-wrap gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <input
          type="email"
          required
          placeholder={tr("adminEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`flex-1 min-w-56 ${inputCls}`}
        />
        <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={inputCls}>
          {(Object.keys(ROLE_META) as StaffRole[]).map((r) => (
            <option key={r} value={r}>{roleLabel[r]}</option>
          ))}
        </select>
        <button
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--pink-deep,#e91e63)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> {L("Shto", "Add")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">{L("Roli", "Role")}</th>
              <th className="px-4 py-3 hidden sm:table-cell">{L("Që nga", "Since")}</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {staff?.map((a) => {
              const Icon = ROLE_META[a.role]?.icon ?? ShieldCheck;
              return (
                <tr key={`${a.user_id}-${a.role}`} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{a.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_META[a.role]?.tone ?? ""}`}>
                      <Icon className="h-3.5 w-3.5" /> {a.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-neutral-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => revoke(a)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {tr("revoke")}
                    </button>
                  </td>
                </tr>
              );
            })}
            {staff && staff.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-neutral-500">—</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
