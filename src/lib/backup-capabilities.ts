export type BackupRole = "admin" | "manager" | "editor" | "customer";
export type BackupEvidence = {
  connected: boolean;
  verified: boolean;
  downloadable: boolean;
  restorable: boolean;
};

// Website files live on cPanel: no authenticated connection exists yet.
export const WEBSITE_BACKUP_EVIDENCE: BackupEvidence = {
  connected: false, verified: false, downloadable: false, restorable: false,
};
// Database + photos backups run through admin-only database functions (create/verify/restore_db_backup).
export const DATABASE_BACKUP_EVIDENCE: BackupEvidence = {
  connected: true, verified: true, downloadable: true, restorable: true,
};
export const RESTORE_CONFIRM_WORD = "RIKTHE";

export function backupPermissions(role: BackupRole, evidence: BackupEvidence, confirmed = false) {
  const available = role === "admin" && evidence.connected && evidence.verified;
  return {
    view: role === "admin",
    create: available,
    download: available && evidence.downloadable,
    restore: available && evidence.restorable && confirmed,
  };
}

/** A snapshot may be restored only when it is verified and the admin typed the exact confirm word. */
export function canRestoreSnapshot(status: string, typed: string) {
  return status === "verified" && typed.trim() === RESTORE_CONFIRM_WORD;
}
