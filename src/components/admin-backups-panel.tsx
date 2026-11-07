import { useState } from "react";
import { Archive, Database, HardDrive, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { backupPermissions, WEBSITE_BACKUP_EVIDENCE, DATABASE_BACKUP_EVIDENCE, type BackupRole } from "@/lib/backup-capabilities";

export function BackupsPanel({ role }: { role: BackupRole }) {
  const [source, setSource] = useState<"website" | "database">("website");
  const [instructions, setInstructions] = useState(false);
  const website = backupPermissions(role, WEBSITE_BACKUP_EVIDENCE);
  const database = backupPermissions(role, DATABASE_BACKUP_EVIDENCE);
  if (!website.view || !database.view) return <p role="alert" className="text-destructive">Vetëm administratori mund të hapë Backup & Restore.</p>;
  return <div className="space-y-8 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Backup & Restore</h2><p className="mt-1 text-sm text-muted-foreground">Website-i dhe databaza ruhen veçmas.</p></div>
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Vetëm administratori</span>
    </header>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 border-t border-border pt-5">
        <div className="flex items-start gap-3"><HardDrive className="mt-1 h-5 w-5 text-primary" /><div><h3 className="font-semibold">Backup i website-it</h3><p className="text-sm text-muted-foreground">HTML, CSS, JavaScript dhe asetet në cPanel</p></div></div>
        <p className="inline-flex items-center gap-2 text-sm font-medium"><LockKeyhole className="h-4 w-4 text-muted-foreground" /> Nuk është konfiguruar</p>
        <dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Backup-i i fundit</dt><dd>Pa të dhëna të verifikuara</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Shkarkim / rikthim</dt><dd>Jo i disponueshëm</dd></div></dl>
        <p className="text-sm text-muted-foreground">Nuk ka lidhje të autentikuar për backup dhe rikthim në cPanel. Kopjet HTML të publikimit nuk janë backup i plotë i website-it dhe as i databazës.</p>
        <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">Cron Job-i dhe lidhja Lovable → GitHub → cPanel mbeten të pandryshuara. Ky seksion nuk kërkon Node.js në cPanel.</p>
      </section>
      <section className="space-y-4 border-t border-border pt-5">
        <div className="flex items-start gap-3"><Database className="mt-1 h-5 w-5 text-primary" /><div><h3 className="font-semibold">Backup i databazës</h3><p className="text-sm text-muted-foreground">Produktet, porositë, llogaritë dhe të dhënat e tjera</p></div></div>
        <p className="inline-flex items-center gap-2 text-sm font-medium"><LockKeyhole className="h-4 w-4 text-muted-foreground" /> Nuk është konfiguruar në këtë panel</p>
        <dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Backup-i i fundit</dt><dd>Nuk është verifikuar</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Burimi i historikut</dt><dd>Lovable Cloud · Backups</dd></div></dl>
        <p className="text-sm text-muted-foreground">Lovable Cloud ofron një backup automatik të databazës në ditë, deri në rreth 14 ditë. Datat dhe kopjet e këtij projekti duhen kontrolluar te More → Database → Manage → Backups.</p>
        <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">Backup-et dhe eksporti i databazës nuk përfshijnë fotot ose skedarët në Storage.</p>
      </section>
    </div>
    <section className="border-t border-border pt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="inline-flex items-center gap-2 font-semibold"><Archive className="h-4 w-4" /> Historiku i backup-eve</h3><div className="flex gap-1" role="tablist" aria-label="Burimi i backup-eve"><Button role="tab" aria-selected={source === "website"} variant={source === "website" ? "secondary" : "ghost"} onClick={() => setSource("website")}><HardDrive /> Website</Button><Button role="tab" aria-selected={source === "database"} variant={source === "database" ? "secondary" : "ghost"} onClick={() => setSource("database")}><Database /> Databaza</Button></div></div>
      <div className="overflow-x-auto rounded-md border border-border bg-background"><table className="w-full text-sm"><thead className="border-b border-border text-left text-muted-foreground"><tr>{["Data (UTC)", "Madhësia", "Statusi", "Shkarkim", "Rikthim"].map((label) => <th key={label} className="p-3 font-medium whitespace-nowrap">{label}</th>)}</tr></thead><tbody><tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">{source === "website" ? "Nuk është konfiguruar — historiku i cPanel nuk është i disponueshëm." : "Historiku i databazës nuk është verifikuar. Kontrollojeni te Lovable Cloud → Backups."}</td></tr></tbody></table></div>
      <p className="text-xs text-muted-foreground">Mungesa e historikut në këtë panel nuk do të thotë se nuk ekzistojnë backup-e.</p>
    </section>
    <section className="border-t border-border pt-6 space-y-4">
      <div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-destructive" /><div><h3 className="font-semibold">Rikthimi kërkon verifikim dhe konfirmim</h3><p className="mt-1 text-sm text-muted-foreground">Nuk kryhet rikthim automatik. Rikthimi i databazës është i përhershëm: humben ndryshimet pas backup-it dhe rikthehet edhe struktura e databazës. Website-i mund të mos përputhet më me të.</p></div></div>
      <Button variant="outline" aria-expanded={instructions} onClick={() => setInstructions(!instructions)}>{instructions ? <ChevronUp /> : <ChevronDown />} {instructions ? "Mbyll hapat e sigurt" : "Shiko hapat e sigurt"}</Button>
      {instructions && <div className="space-y-5 text-sm leading-relaxed">
        <div><h4 className="font-semibold">Eksporti i databazës</h4><ol className="mt-2 list-decimal pl-5 space-y-1"><li>Hap More → Database → Manage → Settings në Lovable.</li><li>Te Export project data, zgjidh Export data → Database → Export → Start export.</li><li>Shkarko eksportin nga lidhja e dërguar me email ose nga More → Storage.</li><li>Fotot dhe skedarët shkarkohen veçmas nga More → Storage.</li></ol><p className="mt-2 text-muted-foreground">Eksporti përfshin strukturën, të dhënat dhe llogaritë e përdoruesve. Nuk përfshin skedarët, sekretet apo cilësimet e hyrjes. Lejohet një eksport çdo 24 orë, për databaza deri në 15 GB dhe skedar eksporti deri në 5 GB; backend-i duhet të jetë aktiv.</p></div>
        <div><h4 className="font-semibold">Rikthimi i databazës</h4><ol className="mt-2 list-decimal pl-5 space-y-1"><li>Merr eksportin e gjendjes aktuale para rikthimit.</li><li>Hap More → Database → Manage → Backups dhe verifiko datën UTC të kopjes.</li><li>Zgjidh Restore to this backup dhe lexo e konfirmo dialogun në Lovable.</li><li>Databaza është e padisponueshme për disa minuta. Pas rikthimit duhen testuar hyrja, produktet, porositë dhe POS-i.</li></ol><p className="mt-2 text-destructive">Nuk ka rikthim në një orë arbitrare, vetëm në kopjet ditore. Të dhënat pas kopjes humben dhe struktura rikthehet bashkë me to.</p></div>
        <div><h4 className="font-semibold">Website-i në cPanel</h4><p className="mt-2 text-muted-foreground">Backup-i i plotë, historiku, shkarkimi dhe rikthimi kërkojnë lidhje të sigurt me cPanel, me arkiva të verifikuara jashtë dosjes publike. Deri atëherë këto veprime nuk janë aktive në Admin.</p></div>
      </div>}
    </section>
  </div>;
}