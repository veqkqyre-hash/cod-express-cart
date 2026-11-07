import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatEur } from "@/lib/cart";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Empty, Panel } from "@/components/admin-ui";
import { listRegisteredUsers, deleteRegisteredUser } from "@/lib/admin-users.functions";

export function CustomersPanel() {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const fetchUsersServer = useServerFn(listRegisteredUsers);
  const removeUserServer = useServerFn(deleteRegisteredUser);
  const useCpanelPhp = typeof window !== "undefined" &&
    (window.location.hostname === "dreamebeautycosmetics.com" ||
     window.location.hostname === "www.dreamebeautycosmetics.com");

  async function callCpanelPhp<T>(action: string, extra: Record<string, string> = {}): Promise<T> {
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (authError || !token) throw new Error("Please sign in again");
    const response = await fetch("/api/customers.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...extra }),
      cache: "no-store",
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = result && typeof result === "object" && "error" in result &&
        typeof result.error === "string" ? result.error : "Customer service unavailable";
      throw new Error(message);
    }
    return result as T;
  }

  async function fetchUsers() {
    if (!useCpanelPhp) return fetchUsersServer();
    const result = await callCpanelPhp<Awaited<ReturnType<typeof fetchUsersServer>>>("list");
    if (!Array.isArray(result)) throw new Error("Invalid customer response");
    return result;
  }
  async function removeUser(userId: string) {
    if (useCpanelPhp) return callCpanelPhp<{ ok: boolean }>("delete", { userId });
    return removeUserServer({ data: { userId } });
  }

  const { data: users, refetch, isLoading, error } = useQuery({
    queryKey: ["admin-registered-users"],
    queryFn: fetchUsers,
  });

  const { data: guests } = useQuery({
    queryKey: ["admin-guest-customers"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("customer_name,phone,email,city,total");
      const map = new Map<string, { name: string; phone: string; city: string; orders: number; total: number }>();
      (data ?? []).forEach((o: any) => {
        const cur = map.get(o.phone) ?? { name: o.customer_name, phone: o.phone, city: o.city, orders: 0, total: 0 };
        cur.orders += 1;
        cur.total += Number(o.total || 0);
        map.set(o.phone, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });

  async function onDelete(id: string, email: string | null) {
    if (!confirm(L(`Fshij llogarinë ${email ?? ""}? Porositë ruhen.`, `Delete account ${email ?? ""}? Orders are kept.`))) return;
    try {
      await removeUser(id);
      toast.success(L("Klienti u fshi", "Customer deleted"));
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 font-display text-lg">{L("Klientët e regjistruar", "Registered customers")}</h2>
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 hidden md:table-cell">{L("Regjistruar", "Registered")}</th>
                  <th className="px-4 py-3">{L("Porosi", "Orders")}</th>
                  <th className="px-4 py-3">{L("Totali", "Total")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr key={u.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium">{u.email ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-neutral-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{u.orders}</td>
                    <td className="px-4 py-3">{formatEur(u.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onDelete(u.id, u.email)} className="inline-grid h-8 w-8 place-items-center rounded-full text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {isLoading && <tr><td colSpan={5}><Empty label="…" /></td></tr>}
                {error && <tr><td colSpan={5}><Empty label={(error as any)?.message ?? "Error"} /></td></tr>}
                {users && users.length === 0 && <tr><td colSpan={5}><Empty label={L("Asnjë klient i regjistruar", "No registered customers")} /></td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg">{L("Sipas porosive", "By orders")}</h2>
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{L("Klienti", "Customer")}</th>
                  <th className="px-4 py-3">{L("Telefoni", "Phone")}</th>
                  <th className="px-4 py-3 hidden md:table-cell">{L("Qyteti", "City")}</th>
                  <th className="px-4 py-3">{L("Porosi", "Orders")}</th>
                  <th className="px-4 py-3">{L("Totali", "Total")}</th>
                </tr>
              </thead>
              <tbody>
                {(guests ?? []).map((c) => (
                  <tr key={c.phone} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.phone}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{c.city}</td>
                    <td className="px-4 py-3">{c.orders}</td>
                    <td className="px-4 py-3 font-medium">{formatEur(c.total)}</td>
                  </tr>
                ))}
                {guests && guests.length === 0 && <tr><td colSpan={5}><Empty label={L("Asnjë klient", "No customers")} /></td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
