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