export type BackupRole = "admin" | "manager" | "editor" | "customer";
export type BackupEvidence = {
  connected: boolean;
  verified: boolean;
  downloadable: boolean;
  restorable: boolean;
};

// No backup provider is connected. Never infer successful backups from deployment logs.
export const WEBSITE_BACKUP_EVIDENCE: BackupEvidence = {
  connected: false, verified: false, downloadable: false, restorable: false,
};
export const DATABASE_BACKUP_EVIDENCE: BackupEvidence = {
  connected: false, verified: false, downloadable: false, restorable: false,
};
export function backupPermissions(role: BackupRole, evidence: BackupEvidence, confirmed = false) {
  const available = role === "admin" && evidence.connected && evidence.verified;
  return {
    view: role === "admin",
    create: available,
    download: available && evidence.downloadable,
    restore: available && evidence.restorable && confirmed,
  };
}
export const RESTORE_CONFIRM_WORD = "RIKTHE";
export function isRestoreConfirmed(text: string) {
  return text.trim() === RESTORE_CONFIRM_WORD;
}

/** Evidence for one real database snapshot, as verified server-side by verify_db_backup. */
export function snapshotEvidence(s: { status: string; photos_status: string } | null): BackupEvidence {
  const verified = !!s && s.status === "verified" && s.photos_status === "verified";
  return { connected: true, verified, downloadable: verified, restorable: verified };
}

export function formatBytes(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}
