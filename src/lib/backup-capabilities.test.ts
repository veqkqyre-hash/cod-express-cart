import { describe, expect, it } from "vitest";
import { backupPermissions, canRestoreSnapshot, WEBSITE_BACKUP_EVIDENCE, DATABASE_BACKUP_EVIDENCE } from "./backup-capabilities";

describe("backup safety", () => {
  it("does not enable website actions without real cPanel access", () => {
    expect(backupPermissions("admin", WEBSITE_BACKUP_EVIDENCE, true)).toEqual({ view: true, create: false, download: false, restore: false });
  });
  it("lets the admin create and download database backups", () => {
    const p = backupPermissions("admin", DATABASE_BACKUP_EVIDENCE);
    expect(p.create).toBe(true);
    expect(p.download).toBe(true);
  });
  it("restricts backup access to administrators", () => {
    for (const role of ["manager", "editor", "customer"] as const) {
      expect(backupPermissions(role, DATABASE_BACKUP_EVIDENCE, true)).toEqual({ view: false, create: false, download: false, restore: false });
    }
  });
  it("requires explicit confirmation before restore", () => {
    expect(backupPermissions("admin", DATABASE_BACKUP_EVIDENCE).restore).toBe(false);
    expect(backupPermissions("admin", DATABASE_BACKUP_EVIDENCE, true).restore).toBe(true);
  });
  it("restores only verified snapshots after typing RIKTHE", () => {
    expect(canRestoreSnapshot("verified", "RIKTHE")).toBe(true);
    expect(canRestoreSnapshot("verified", "rikthe")).toBe(false);
    expect(canRestoreSnapshot("failed", "RIKTHE")).toBe(false);
    expect(canRestoreSnapshot("pending", "RIKTHE")).toBe(false);
  });
});
