import { supabase } from "@/integrations/supabase/client";

export type SnapshotRow = {
  id: string; created_at: string; created_by_email: string | null; kind: string; status: string;
  size_bytes: number; sha256: string; table_counts: Record<string, number>;
  photos_manifest: { name: string; size: number }[]; photos_count: number; photos_bytes: number;
  photos_status: string; verified_at: string | null; restored_at: string | null;
  restored_by_email: string | null; error: string | null;
};

const LIST_COLS = "id,created_at,created_by_email,kind,status,size_bytes,sha256,table_counts,photos_manifest,photos_count,photos_bytes,photos_status,verified_at,restored_at,restored_by_email,error";

export async function listSnapshots(): Promise<SnapshotRow[]> {
  const { data, error } = await supabase.from("backup_snapshots").select(LIST_COLS).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as SnapshotRow[];
}

function isExists(msg: string) { return /exist|duplicate|409/i.test(msg); }

/** Copies every photo listed in the snapshot manifest into the private backups bucket. */
async function copyPhotosToBackup(id: string, manifest: { name: string }[], onProgress?: (done: number, total: number) => void) {
  let done = 0;
  for (const p of manifest) {
    const { error } = await supabase.storage.from("product-images").copy(p.name, `${id}/photos/${p.name}`, { destinationBucket: "backups" });
    if (error && !isExists(error.message)) throw new Error(`Foto "${p.name}": ${error.message}`);
    onProgress?.(++done, manifest.length);
  }
}

export async function createFullDbBackup(onProgress?: (msg: string) => void) {
  onProgress?.("Duke ruajtur databazën…");
  const { data, error } = await supabase.rpc("create_db_backup", { _kind: "manual" });
  if (error) throw error;
  return finishSnapshot((data as unknown as { id: string }).id, onProgress);
}

/** Copies the snapshot's photos into the private backups folder (skips ones already copied), then verifies server-side. */
export async function finishSnapshot(id: string, onProgress?: (msg: string) => void) {
  const { data: row, error } = await supabase.from("backup_snapshots").select("photos_manifest").eq("id", id).single();
  if (error) throw error;
  const manifest = (row?.photos_manifest ?? []) as { name: string }[];
  await copyPhotosToBackup(id, manifest, (d, t) => onProgress?.(`Duke kopjuar fotot ${d}/${t}…`));
  onProgress?.("Duke verifikuar…");
  return verifySnapshot(id);
}

export async function verifySnapshot(id: string) {
  const { data, error } = await supabase.rpc("verify_db_backup", { _id: id });
  if (error) throw error;
  return data as unknown as { status: string; checksum_ok: boolean; missing_tables: number; missing_photos: number };
}

export async function downloadSnapshot(s: SnapshotRow) {
  const { data, error } = await supabase.from("backup_snapshots").select("data").eq("id", s.id).single();
  if (error) throw error;
  const file = {
    format: "dreame-db-backup/1", id: s.id, created_at: s.created_at, sha256: s.sha256,
    table_counts: s.table_counts, photos_manifest: s.photos_manifest, data: data?.data,
  };
  const blob = new Blob([JSON.stringify(file)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `dreame-databaza-${s.created_at.slice(0, 19).replace(/[:T]/g, "-")}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function signedPhotoLink(id: string, name: string) {
  const { data, error } = await supabase.storage.from("backups").createSignedUrl(`${id}/photos/${name}`, 600, { download: true });
  if (error) throw error;
  return data.signedUrl;
}

/** Non-destructive restore: database rows are upserted server-side, missing photos are copied back. */
export async function restoreSnapshot(s: SnapshotRow, confirmWord: string, onProgress?: (msg: string) => void) {
  onProgress?.("Duke rikthyer databazën…");
  const { data, error } = await supabase.rpc("restore_db_backup", { _id: s.id, _confirm: confirmWord });
  if (error) throw error;
  const pre = (data as unknown as { pre_restore_backup: string }).pre_restore_backup;
  if (pre) await finishSnapshot(pre, onProgress);
  let restored = 0, existing = 0;
  for (const p of s.photos_manifest) {
    const { error: ce } = await supabase.storage.from("backups").copy(`${s.id}/photos/${p.name}`, p.name, { destinationBucket: "product-images" });
    if (!ce) restored++;
    else if (isExists(ce.message)) existing++;
    else throw new Error(`Foto "${p.name}": ${ce.message}`);
    onProgress?.(`Duke kontrolluar fotot ${restored + existing}/${s.photos_manifest.length}…`);
  }
  return { ...(data as unknown as { rows: Record<string, number>; pre_restore_backup: string }), photosRestored: restored, photosExisting: existing };
}
