import { useCallback, useEffect, useState } from "react";
import { Archive, Database, HardDrive, ShieldCheck, LockKeyhole, Plus, RotateCcw, Download, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { backupPermissions, snapshotEvidence, isRestoreConfirmed, formatBytes, RESTORE_CONFIRM_WORD, type BackupRole } from "@/lib/backup-capabilities";
import { listSnapshots, createFullDbBackup, downloadSnapshot, restoreSnapshot, verifySnapshot, type SnapshotRow } from "@/lib/db-backup";
import { websiteStatus, websiteCreate, websiteDownloadLink, type WebsiteStatus } from "@/lib/website-backup";

const fmtDate = (s: string) => new Date(s).toLocaleString("sq-AL", { timeZone: "Europe/Belgrade" });
const errMsg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message) || "Gabim i panjohur";

function StatusBadge({ s }: { s: SnapshotRow }) {
  if (s.status === "verified" && s.photos_status === "verified")
    return <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="h-4 w-4" /> I verifikuar</span>;
  if (s.status === "failed" || s.photos_status === "incomplete")
    return <span className="inline-flex items-center gap-1 text-destructive" title={s.error ?? ""}><AlertTriangle className="h-4 w-4" /> Dështoi verifikimi</span>;
  return <span className="text-muted-foreground">Pa verifikuar</span>;
}

export function BackupsPanel({ role }: { role: BackupRole }) {
  const [source, setSource] = useState<"database" | "website">("database");
  const [snaps, setSnaps] = useState<SnapshotRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<SnapshotRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [web, setWeb] = useState<WebsiteStatus | null>(null);
  const [webErr, setWebErr] = useState<string | null>(null);
  const allowed = role === "admin";

  const loadSnaps = useCallback(async () => {
    try { setSnaps(await listSnapshots()); } catch (e) { toast.error(`Historiku nuk u lexua: ${errMsg(e)}`); setSnaps([]); }
  }, []);
  const loadWeb = useCallback(async () => {
    setWebErr(null);
    try { setWeb(await websiteStatus()); } catch (e) { setWeb(null); setWebErr(errMsg(e)); }
  }, []);
  useEffect(() => { if (allowed) { void loadSnaps(); void loadWeb(); } }, [allowed, loadSnaps, loadWeb]);

  if (!allowed) return <p role="alert" className="text-destructive">Vetëm administratori mund të hapë Backup & Restore.</p>;

  const latest = snaps?.find((s) => s.status === "verified" && s.photos_status === "verified") ?? null;
  const webReady = !!web?.configured && !!web?.cpanel_ok;

  async function onCreateDb() {
    setBusy("Duke filluar…");
    try {
      const r = await createFullDbBackup(setBusy);
      if (r.status === "verified") toast.success("Backup-i i databazës dhe fotove u krijua dhe u verifikua.");
      else toast.error(`Backup-i u krijua, por verifikimi dështoi (foto që mungojnë: ${r.missing_photos}).`);
    } catch (e) { toast.error(`Backup-i dështoi: ${errMsg(e)}`); }
    setBusy(null); void loadSnaps();
  }
  async function onVerify(s: SnapshotRow) {
    setBusy("Duke verifikuar…");
    try { const r = await verifySnapshot(s.id); r.status === "verified" ? toast.success("Backup-i është i plotë dhe i paprekur.") : toast.error("Verifikimi dështoi."); }
    catch (e) { toast.error(errMsg(e)); }
    setBusy(null); void loadSnaps();
  }
  async function onDownload(s: SnapshotRow) {
    try { await downloadSnapshot(s); } catch (e) { toast.error(`Shkarkimi dështoi: ${errMsg(e)}`); }
  }
  async function onRestore() {
    if (!restoreTarget || !isRestoreConfirmed(confirmText)) return;
    const s = restoreTarget; setRestoreTarget(null); setBusy("Duke rikthyer…");
    try {
      const r = await restoreSnapshot(s, confirmText.trim(), setBusy);
      const rows = Object.values(r.rows).reduce((a, b) => a + b, 0);
      toast.success(`Rikthimi përfundoi: ${rows} rreshta u rikthyen, ${r.photosRestored} foto u rikthyen. U ruajt edhe një backup para rikthimit.`);
    } catch (e) { toast.error(`Rikthimi u ndal, asgjë nuk u ndryshua në databazë: ${errMsg(e)}`); }
    setConfirmText(""); setBusy(null); void loadSnaps();
  }
  async function onWebCreate() {
    setBusy("Duke kërkuar backup nga cPanel…");
    try { const r = await websiteCreate(); toast.success(r.message); } catch (e) { toast.error(`cPanel: ${errMsg(e)}`); }
    setBusy(null); void loadWeb();
  }
  async function onWebDownload(name: string) {
    try { const { url } = await websiteDownloadLink(name); window.location.href = url; } catch (e) { toast.error(errMsg(e)); }
  }

  return <div className="space-y-8 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Backup & Restore</h2><p className="mt-1 text-sm text-muted-foreground">Website-i dhe databaza ruhen veçmas.</p></div>
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Vetëm administratori</span>
    </header>
    {busy && <p className="inline-flex items-center gap-2 text-sm text-primary" role="status"><Loader2 className="h-4 w-4 animate-spin" /> {busy}</p>}

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 border-t border-border pt-5">
        <div className="flex items-start gap-3"><Database className="mt-1 h-5 w-5 text-primary" /><div><h3 className="font-semibold">Backup i databazës + fotove</h3><p className="text-sm text-muted-foreground">Produktet, porositë, ARKA, klientët e porosive, cilësimet dhe të gjitha fotot e produkteve</p></div></div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Backup-i i fundit i verifikuar</dt><dd>{latest ? fmtDate(latest.created_at) : "Asnjë ende"}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Madhësia</dt><dd>{latest ? `${formatBytes(latest.size_bytes)} + ${formatBytes(latest.photos_bytes)} foto` : "—"}</dd></div>
        </dl>
        <Button onClick={onCreateDb} disabled={!!busy}><Plus /> Krijo backup të databazës</Button>
        <p className="border-l-2 border-border pl-3 text-xs text-muted-foreground">Rikthimi nuk fshin asgjë: rreshtat nga backup-i shtohen ose kthehen në vlerat e ruajtura, të dhënat e reja mbeten. Llogaritë, rolet dhe audit log-u nuk ndryshohen. Para çdo rikthimi ruhet automatikisht një backup i ri.</p>
      </section>
      <section className="space-y-4 border-t border-border pt-5">
        <div className="flex items-start gap-3"><HardDrive className="mt-1 h-5 w-5 text-primary" /><div><h3 className="font-semibold">Backup i website-it (cPanel)</h3><p className="text-sm text-muted-foreground">Backup i plotë i cPanel: HTML, CSS, JS, asetet dhe skedarët PHP</p></div></div>
        {webReady
          ? <p className="inline-flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle2 className="h-4 w-4" /> I lidhur me cPanel</p>
          : <p className="inline-flex items-center gap-2 text-sm font-medium"><LockKeyhole className="h-4 w-4 text-muted-foreground" /> Nuk është konfiguruar</p>}
        {!webReady && <p className="text-sm text-muted-foreground">{webErr ? `Lidhja me cPanel nuk u gjet (${webErr}).` : web?.error ?? "Lidhja me cPanel nuk është aktive."} Skedari PHP duhet vendosur në cPanel sipas udhëzimit.</p>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onWebCreate} disabled={!webReady || !!busy}><Plus /> Krijo backup të website-it</Button>
          <Button variant="ghost" onClick={() => void loadWeb()}><RefreshCw /> Kontrollo lidhjen</Button>
        </div>
        <p className="border-l-2 border-border pl-3 text-xs text-muted-foreground">Rikthimi i website-it bëhet në cPanel → Backup → “Restore a Home Directory Backup”, ose me rikthimin e versionit të mëparshëm nga GitHub. Cron Job-i dhe lidhja Lovable → GitHub → cPanel nuk preken.</p>
      </section>
    </div>

    <section className="border-t border-border pt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="inline-flex items-center gap-2 font-semibold"><Archive className="h-4 w-4" /> Historiku i backup-eve</h3><div className="flex gap-1" role="tablist" aria-label="Burimi i backup-eve"><Button role="tab" aria-selected={source === "database"} variant={source === "database" ? "secondary" : "ghost"} onClick={() => setSource("database")}><Database /> Databaza</Button><Button role="tab" aria-selected={source === "website"} variant={source === "website" ? "secondary" : "ghost"} onClick={() => setSource("website")}><HardDrive /> Website</Button></div></div>
      <div className="overflow-x-auto rounded-md border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground"><tr>{["Data", "Madhësia", "Statusi", "Veprime"].map((l) => <th key={l} className="p-3 font-medium whitespace-nowrap">{l}</th>)}</tr></thead>
          <tbody>
            {source === "database" && (snaps === null
              ? <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Duke lexuar…</td></tr>
              : snaps.length === 0
                ? <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nuk ka ende backup të databazës.</td></tr>
                : snaps.map((s) => {
                    const p = backupPermissions(role, snapshotEvidence(s), true);
                    return <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="p-3 whitespace-nowrap">{fmtDate(s.created_at)}<div className="text-xs text-muted-foreground">{s.kind === "pre_restore" ? "Automatik para rikthimit" : "Manual"} · {s.created_by_email ?? ""}{s.restored_at ? ` · rikthyer ${fmtDate(s.restored_at)}` : ""}</div></td>
                      <td className="p-3 whitespace-nowrap">{formatBytes(s.size_bytes)}<div className="text-xs text-muted-foreground">{s.photos_count} foto · {formatBytes(s.photos_bytes)}</div></td>
                      <td className="p-3 whitespace-nowrap"><StatusBadge s={s} /></td>
                      <td className="p-3"><div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" disabled={!p.download || !!busy} onClick={() => onDownload(s)}><Download /> Shkarko</Button>
                        <Button size="sm" variant="outline" disabled={!p.restore || !!busy} onClick={() => { setConfirmText(""); setRestoreTarget(s); }}><RotateCcw /> Rikthe</Button>
                        {!p.restore && <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => onVerify(s)}>Verifiko</Button>}
                      </div></td>
                    </tr>;
                  }))}
            {source === "website" && (!webReady
              ? <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nuk është konfiguruar — historiku i cPanel nuk është i disponueshëm.</td></tr>
              : web!.backups.length === 0
                ? <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nuk ka backup në cPanel ende.</td></tr>
                : web!.backups.map((b) => <tr key={b.name} className="border-b border-border last:border-0">
                    <td className="p-3 whitespace-nowrap">{fmtDate(b.modified)}<div className="text-xs text-muted-foreground">{b.name}</div></td>
                    <td className="p-3">{formatBytes(b.size)}</td>
                    <td className="p-3"><span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="h-4 w-4" /> Në cPanel</span></td>
                    <td className="p-3"><Button size="sm" variant="outline" onClick={() => onWebDownload(b.name)}><Download /> Shkarko</Button></td>
                  </tr>))}
          </tbody>
        </table>
      </div>
    </section>

    <Dialog open={!!restoreTarget} onOpenChange={(o) => { if (!o) setRestoreTarget(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rikthe backup-in e {restoreTarget ? fmtDate(restoreTarget.created_at) : ""}?</DialogTitle>
          <DialogDescription>Produktet, porositë, shitjet e ARKËS, cilësimet dhe përmbajtja kthehen në vlerat e këtij backup-i. Ndryshimet e bëra pas kësaj date në të njëjtat rreshta mbishkruhen. Asgjë nuk fshihet dhe para rikthimit ruhet automatikisht një backup i ri.</DialogDescription>
        </DialogHeader>
        <label className="text-sm">Shkruani <strong>{RESTORE_CONFIRM_WORD}</strong> për të konfirmuar
          <Input className="mt-2" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setRestoreTarget(null)}>Anulo</Button>
          <Button variant="destructive" disabled={!isRestoreConfirmed(confirmText)} onClick={onRestore}><RotateCcw /> Rikthe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
