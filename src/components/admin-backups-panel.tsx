import { useCallback, useEffect, useState } from "react";
import { Archive, Database, HardDrive, ShieldCheck, LockKeyhole, Plus, RotateCcw, Download, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { backupPermissions, canRestoreSnapshot, RESTORE_CONFIRM_WORD, WEBSITE_BACKUP_EVIDENCE, DATABASE_BACKUP_EVIDENCE, type BackupRole } from "@/lib/backup-capabilities";

type Snapshot = {
  id: string; created_at: string; created_by_email: string | null; kind: string; status: string;
  size_bytes: number; photos_count: number; photos_bytes: number; photos_status: string;
  verified_at: string | null; restored_at: string | null; error: string | null;
  table_counts: Record<string, number>;
};
type ManifestItem = { name: string; size: number };

const fmtBytes = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`;
const fmtDate = (s: string) => new Date(s).toLocaleString("sq-AL", { dateStyle: "medium", timeStyle: "short" });
const errMsg = (e: unknown) => (e as { message?: string })?.message || "Gabim i panjohur";

/** Copies every photo listed in the backup into the private backups folder, then verifies the backup. */
async function copyPhotosAndVerify(id: string) {
  const { data: row, error } = await supabase.from("backup_snapshots").select("photos_manifest").eq("id", id).single();
  if (error) throw error;
  const manifest = (row?.photos_manifest ?? []) as unknown as ManifestItem[];
  for (const m of manifest) {
    const { data: blob, error: dErr } = await supabase.storage.from("product-images").download(m.name);
    if (dErr || !blob) throw new Error(`Foto nuk u lexua: ${m.name}`);
    const { error: uErr } = await supabase.storage.from("backups").upload(`${id}/photos/${m.name}`, blob, { upsert: false, contentType: blob.type || undefined });
    if (uErr && !/exists|duplicate/i.test(uErr.message)) throw uErr;
  }
  const { data: v, error: vErr } = await supabase.rpc("verify_db_backup", { _id: id });
  if (vErr) throw vErr;
  return v as { status: string; missing_photos: number };
}

/** Puts back any photo from the backup that is missing in the shop; never deletes or overwrites photos. */
async function restoreMissingPhotos(id: string) {
  const { data: row } = await supabase.from("backup_snapshots").select("photos_manifest").eq("id", id).single();
  const manifest = (row?.photos_manifest ?? []) as unknown as ManifestItem[];
  let restored = 0;
  for (const m of manifest) {
    const { data: blob } = await supabase.storage.from("backups").download(`${id}/photos/${m.name}`);
    if (!blob) continue;
    const { error } = await supabase.storage.from("product-images").upload(m.name, blob, { upsert: false, contentType: blob.type || undefined });
    if (!error) restored++;
  }
  return restored;
}

export function BackupsPanel({ role }: { role: BackupRole }) {
  const [source, setSource] = useState<"website" | "database">("database");
  const [rows, setRows] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Snapshot | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const website = backupPermissions(role, WEBSITE_BACKUP_EVIDENCE);
  const database = backupPermissions(role, DATABASE_BACKUP_EVIDENCE);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("backup_snapshots")
      .select("id,created_at,created_by_email,kind,status,size_bytes,photos_count,photos_bytes,photos_status,verified_at,restored_at,error,table_counts")
      .order("created_at", { ascending: false }).limit(100);
    if (error) toast.error("Historiku nuk u lexua: " + error.message);
    setRows((data ?? []) as unknown as Snapshot[]);
    setLoading(false);
  }, []);
  useEffect(() => { if (role === "admin") void load(); }, [load, role]);

  if (!database.view) return <p role="alert" className="text-destructive">Vetëm administratori mund të hapë Backup & Restore.</p>;

  const create = async () => {
    setBusy("create");
    try {
      const { data, error } = await supabase.rpc("create_db_backup", { _kind: "manual" });
      if (error) throw error;
      const id = (data as { id: string }).id;
      const v = await copyPhotosAndVerify(id);
      if (v.status === "verified") toast.success("Backup-i u krijua dhe u verifikua.");
      else toast.error(`Backup-i u krijua por nuk u verifikua (foto që mungojnë: ${v.missing_photos}).`);
    } catch (e) { toast.error("Backup-i dështoi: " + errMsg(e)); }
    setBusy(null); void load();
  };

  const download = async (s: Snapshot) => {
    setBusy("dl-" + s.id);
    try {
      const { data, error } = await supabase.from("backup_snapshots").select("*").eq("id", s.id).single();
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dreame-backup-${s.created_at.slice(0, 19).replace(/[:T]/g, "-")}.json`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch (e) { toast.error("Shkarkimi dështoi: " + errMsg(e)); }
    setBusy(null);
  };

  const reverify = async (s: Snapshot) => {
    setBusy("v-" + s.id);
    try {
      const v = await copyPhotosAndVerify(s.id);
      v.status === "verified" ? toast.success("Backup-i u verifikua.") : toast.error("Verifikimi dështoi.");
    } catch (e) { toast.error("Verifikimi dështoi: " + errMsg(e)); }
    setBusy(null); void load();
  };

  const restore = async () => {
    const s = restoreTarget;
    if (!s || !canRestoreSnapshot(s.status, confirmText)) return;
    setBusy("r-" + s.id);
    try {
      const { data, error } = await supabase.rpc("restore_db_backup", { _id: s.id, _confirm: confirmText.trim() });
      if (error) throw error;
      const safetyId = (data as { pre_restore_backup?: string })?.pre_restore_backup;
      if (safetyId) { try { await copyPhotosAndVerify(safetyId); } catch { /* safety backup data is still saved */ } }
      const photos = await restoreMissingPhotos(s.id);
      toast.success(`Rikthimi u krye.${photos ? ` U rikthyen ${photos} foto.` : ""} U ruajt edhe një backup sigurie para rikthimit.`);
      setRestoreTarget(null); setConfirmText("");
    } catch (e) { toast.error("Rikthimi dështoi: " + errMsg(e)); }
    setBusy(null); void load();
  };

  const last = rows.find((r) => r.status === "verified");

  return <div className="space-y-8 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Backup & Restore</h2><p className="mt-1 text-sm text-muted-foreground">Website-i dhe databaza ruhen veçmas.</p></div>
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Vetëm administratori</span>
    </header>

    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={create} disabled={!database.create || busy !== null}>
        {busy === "create" ? <Loader2 className="animate-spin" /> : <Plus />} {busy === "create" ? "Duke krijuar backup..." : "Krijo backup të databazës"}
      </Button>
      <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Rifresko</Button>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 border-t border-border pt-5">
        <div className="flex items-start gap-3"><Database className="mt-1 h-5 w-5 text-primary" /><div><h3 className="font-semibold">Backup i databazës + fotove</h3><p className="text-sm text-muted-foreground">Produktet, porositë, ARKA, faqet, cilësimet dhe fotot e produkteve</p></div></div>
        <p className="inline-flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4 text-primary" /> Aktiv</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Backup-i i fundit i verifikuar</dt><dd>{last ? fmtDate(last.created_at) : "Asnjë ende"}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Gjithsej backup-e</dt><dd>{rows.length}</dd></div>
        </dl>
        <p className="text-sm text-muted-foreground">Rikthimi nuk fshin asgjë: kthen të dhënat e backup-it mbi ato ekzistuese. Para çdo rikthimi ruhet automatikisht një backup sigurie.</p>
      </section>
      <section className="space-y-4 border-t border-border pt-5">
        <div className="flex items-start gap-3"><HardDrive className="mt-1 h-5 w-5 text-primary" /><div><h3 className="font-semibold">Backup i website-it</h3><p className="text-sm text-muted-foreground">HTML, CSS, JavaScript dhe asetet në cPanel</p></div></div>
        <p className="inline-flex items-center gap-2 text-sm font-medium"><LockKeyhole className="h-4 w-4 text-muted-foreground" /> Nuk është konfiguruar</p>
        <dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Shkarkim / rikthim</dt><dd>{website.create ? "I disponueshëm" : "Jo i disponueshëm"}</dd></div></dl>
        <p className="text-sm text-muted-foreground">Skedarët e website-it ruhen te cPanel → Backup. Cron Job-i dhe lidhja GitHub → cPanel nuk preken.</p>
      </section>
    </div>

    <section className="border-t border-border pt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="inline-flex items-center gap-2 font-semibold"><Archive className="h-4 w-4" /> Historiku i backup-eve</h3><div className="flex gap-1" role="tablist" aria-label="Burimi i backup-eve"><Button role="tab" aria-selected={source === "database"} variant={source === "database" ? "secondary" : "ghost"} onClick={() => setSource("database")}><Database /> Databaza</Button><Button role="tab" aria-selected={source === "website"} variant={source === "website" ? "secondary" : "ghost"} onClick={() => setSource("website")}><HardDrive /> Website</Button></div></div>
      <div className="overflow-x-auto rounded-md border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground"><tr>{["Data", "Lloji", "Madhësia", "Statusi", "Veprime"].map((l) => <th key={l} className="p-3 font-medium whitespace-nowrap">{l}</th>)}</tr></thead>
          <tbody>
            {source === "website" && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Nuk është konfiguruar — historiku i cPanel nuk është i lidhur.</td></tr>}
            {source === "database" && loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
            {source === "database" && !loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Ende nuk ka backup. Shtypni "Krijo backup të databazës".</td></tr>}
            {source === "database" && !loading && rows.map((s) => {
              const ok = s.status === "verified";
              return <tr key={s.id} className="border-b border-border last:border-0">
                <td className="p-3 whitespace-nowrap">{fmtDate(s.created_at)}<div className="text-xs text-muted-foreground">{s.created_by_email ?? ""}</div></td>
                <td className="p-3 whitespace-nowrap">{s.kind === "pre_restore" ? "Sigurie (para rikthimit)" : "Manual"}{s.restored_at && <div className="text-xs text-muted-foreground">Rikthyer: {fmtDate(s.restored_at)}</div>}</td>
                <td className="p-3 whitespace-nowrap">{fmtBytes(s.size_bytes)}<div className="text-xs text-muted-foreground">+ {s.photos_count} foto ({fmtBytes(s.photos_bytes)})</div></td>
                <td className="p-3 whitespace-nowrap">{ok
                  ? <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="h-4 w-4" /> I verifikuar</span>
                  : <span className="inline-flex items-center gap-1 text-destructive" title={s.error ?? ""}><AlertTriangle className="h-4 w-4" /> {s.status === "pending" ? "Në pritje" : "Jo i verifikuar"}</span>}</td>
                <td className="p-3"><div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => download(s)} disabled={busy !== null}>{busy === "dl-" + s.id ? <Loader2 className="animate-spin" /> : <Download />} Shkarko</Button>
                  {ok
                    ? <Button size="sm" variant="outline" onClick={() => { setRestoreTarget(s); setConfirmText(""); }} disabled={busy !== null}><RotateCcw /> Rikthe</Button>
                    : <Button size="sm" variant="ghost" onClick={() => reverify(s)} disabled={busy !== null}>{busy === "v-" + s.id ? <Loader2 className="animate-spin" /> : <RefreshCw />} Verifiko</Button>}
                </div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>

    <Dialog open={!!restoreTarget} onOpenChange={(o) => { if (!o && !busy) { setRestoreTarget(null); setConfirmText(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rikthe backup-in</DialogTitle>
          <DialogDescription>
            {restoreTarget && <>Backup-i i datës <strong>{fmtDate(restoreTarget.created_at)}</strong> do të kthehet. Të dhënat e ndryshuara pas kësaj date do të kthehen si në backup. Asgjë nuk fshihet dhe para rikthimit ruhet një backup sigurie.</>}
          </DialogDescription>
        </DialogHeader>
        <label className="space-y-2 text-sm"><span>Shkruani <strong>{RESTORE_CONFIRM_WORD}</strong> për të konfirmuar:</span>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={RESTORE_CONFIRM_WORD} autoFocus />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setRestoreTarget(null); setConfirmText(""); }} disabled={!!busy}>Anulo</Button>
          <Button variant="destructive" onClick={restore} disabled={!restoreTarget || !canRestoreSnapshot(restoreTarget.status, confirmText) || !!busy}>
            {busy?.startsWith("r-") ? <Loader2 className="animate-spin" /> : <RotateCcw />} Rikthe tani
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
