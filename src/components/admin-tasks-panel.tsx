import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Modal, Field, TextArea, FormActions, Panel, Empty, AddButton } from "@/components/admin-ui";
import { logAction } from "@/lib/audit";
import { CalendarDays, Trash2, Pencil, CircleDot, Loader2, CheckCircle2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_email: string | null;
  due_date: string | null;
  priority: "low" | "normal" | "high";
  status: "pending" | "in_progress" | "done";
  created_by_email: string | null;
  created_at: string;
};

type Staff = { user_id: string; email: string; role: string };

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  normal: "bg-blue-100 text-blue-800",
  low: "bg-neutral-100 text-neutral-600",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  in_progress: "bg-purple-100 text-purple-900",
  done: "bg-green-100 text-green-900",
};

export function TasksPanel({ role, userId }: { role: "admin" | "manager" | "editor"; userId: string | null }) {
  const { lang } = useI18n();
  const L = (sq: string, en: string) => (lang === "sq" ? sq : en);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "done">("all");

  const canManage = role === "admin" || role === "manager";

  const { data: tasks } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  const { data: staff } = useQuery({
    queryKey: ["admin-staff-list"],
    enabled: canManage,
    queryFn: async () => {
      const { data } = await supabase.rpc("list_staff");
      return (data ?? []) as Staff[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task["status"] }) => {
      const { error } = await supabase.from("admin_tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success(L("Statusi u ndryshua", "Status updated"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success(L("Detyra u fshi", "Task deleted"));
      logAction("task.delete", "admin_tasks", null, {});
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const assignedTo = (fd.get("assigned_to") as string) || null;
    const staffMember = staff?.find((s) => s.user_id === assignedTo);
    const payload = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || null,
      assigned_to: assignedTo,
      assigned_email: staffMember?.email ?? null,
      due_date: (fd.get("due_date") as string) || null,
      priority: (fd.get("priority") as string) || "normal",
      status: (fd.get("status") as string) || "pending",
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("admin_tasks").update(payload).eq("id", editing.id));
      if (!error) logAction("task.update", "admin_tasks", editing.id, { title: payload.title });
    } else {
      const { data: u } = await supabase.auth.getUser();
      ({ error } = await supabase.from("admin_tasks").insert({
        ...payload,
        created_by: u.user?.id ?? null,
        created_by_email: u.user?.email ?? null,
      }));
      if (!error) logAction("task.create", "admin_tasks", null, { title: payload.title });
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(L("Detyra u ruajt", "Task saved"));
    setAdding(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-tasks"] });
  }

  const filtered = (tasks ?? []).filter((t) => filter === "all" || t.status === filter);
  const counts = {
    pending: (tasks ?? []).filter((t) => t.status === "pending").length,
    in_progress: (tasks ?? []).filter((t) => t.status === "in_progress").length,
    done: (tasks ?? []).filter((t) => t.status === "done").length,
  };

  const statusLabel = (s: string) =>
    s === "pending" ? L("Në pritje", "Pending") : s === "in_progress" ? L("Në proces", "In progress") : L("Përfunduar", "Done");
  const priorityLabel = (p: string) =>
    p === "high" ? L("I lartë", "High") : p === "low" ? L("I ulët", "Low") : L("Normal", "Normal");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "pending", "in_progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === f ? "bg-[var(--pink-deep,#e91e63)] text-white" : "border border-neutral-200 bg-white hover:bg-neutral-50"
            }`}
          >
            {f === "all" ? L("Të gjitha", "All") : statusLabel(f)}
            {f !== "all" && <span className="ml-1.5 text-xs opacity-70">{counts[f]}</span>}
          </button>
        ))}
      </div>

      {canManage && <AddButton label={L("Shto detyrë", "Add task")} onClick={() => { setEditing(null); setAdding(true); }} />}

      <Panel>
        {filtered.length === 0 ? (
          <Empty label={L("Nuk ka detyra.", "No tasks.")} />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {filtered.map((t) => {
              const overdue = t.due_date && t.status !== "done" && new Date(t.due_date) < new Date(new Date().toDateString());
              const mine = t.assigned_to === userId;
              return (
                <li key={t.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                  <div className="mt-0.5">
                    {t.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : t.status === "in_progress" ? (
                      <Loader2 className="h-5 w-5 text-purple-600" />
                    ) : (
                      <CircleDot className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{t.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[t.priority]}`}>{priorityLabel(t.priority)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[t.status]}`}>{statusLabel(t.status)}</span>
                      {mine && <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-800">{L("E imja", "Mine")}</span>}
                    </div>
                    {t.description && <p className="mt-1 text-sm text-neutral-600">{t.description}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      {t.assigned_email && <span>{L("Caktuar:", "Assigned:")} {t.assigned_email}</span>}
                      {t.due_date && (
                        <span className={`inline-flex items-center gap-1 ${overdue ? "font-semibold text-red-600" : ""}`}>
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(t.due_date).toLocaleDateString(lang === "sq" ? "sq-AL" : "en-GB")}
                          {overdue && ` · ${L("Ka kaluar afati!", "Overdue!")}`}
                        </span>
                      )}
                      {t.created_by_email && <span>{L("Krijuar nga:", "By:")} {t.created_by_email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(canManage || mine) && t.status !== "done" && (
                      <select
                        value={t.status}
                        onChange={(e) => statusMutation.mutate({ id: t.id, status: e.target.value as Task["status"] })}
                        className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                      >
                        <option value="pending">{statusLabel("pending")}</option>
                        <option value="in_progress">{statusLabel("in_progress")}</option>
                        <option value="done">{statusLabel("done")}</option>
                      </select>
                    )}
                    {canManage && (
                      <button onClick={() => { setEditing(t); setAdding(true); }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-neutral-100" title={L("Ndrysho", "Edit")}>
                        <Pencil className="h-4 w-4 text-neutral-500" />
                      </button>
                    )}
                    {role === "admin" && (
                      <button
                        onClick={() => { if (confirm(L("Fshihet kjo detyrë?", "Delete this task?"))) deleteMutation.mutate(t.id); }}
                        className="grid h-8 w-8 place-items-center rounded-lg hover:bg-red-50"
                        title={L("Fshi", "Delete")}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {adding && (
        <Modal title={editing ? L("Ndrysho detyrën", "Edit task") : L("Detyrë e re", "New task")} onClose={() => { setAdding(false); setEditing(null); }}>
          <form onSubmit={save} className="space-y-4 p-6">
            <Field label={L("Çfarë duhet bërë", "What needs to be done")} name="title" required defaultValue={editing?.title} />
            <TextArea label={L("Përshkrimi (opsional)", "Description (optional)")} name="description" defaultValue={editing?.description} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{L("Caktuar për", "Assigned to")}</label>
                <select name="assigned_to" defaultValue={editing?.assigned_to ?? ""} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                  <option value="">{L("— Askush —", "— Nobody —")}</option>
                  {(staff ?? []).map((s) => (
                    <option key={s.user_id} value={s.user_id}>{s.email} ({s.role})</option>
                  ))}
                </select>
              </div>
              <Field label={L("Afati i përfundimit", "Due date")} name="due_date" type="date" defaultValue={editing?.due_date} />
              <div>
                <label className="mb-1.5 block text-sm font-medium">{L("Prioriteti", "Priority")}</label>
                <select name="priority" defaultValue={editing?.priority ?? "normal"} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                  <option value="low">{priorityLabel("low")}</option>
                  <option value="normal">{priorityLabel("normal")}</option>
                  <option value="high">{priorityLabel("high")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{L("Statusi", "Status")}</label>
                <select name="status" defaultValue={editing?.status ?? "pending"} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
                  <option value="pending">{statusLabel("pending")}</option>
                  <option value="in_progress">{statusLabel("in_progress")}</option>
                  <option value="done">{statusLabel("done")}</option>
                </select>
              </div>
            </div>
            <FormActions saving={saving} cancelLabel={L("Anulo", "Cancel")} saveLabel={L("Ruaj", "Save")} onCancel={() => { setAdding(false); setEditing(null); }} />
          </form>
        </Modal>
      )}
    </div>
  );
}
