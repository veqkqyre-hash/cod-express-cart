import { describe, expect, it } from "vitest";
import { backupPermissions, WEBSITE_BACKUP_EVIDENCE, DATABASE_BACKUP_EVIDENCE } from "./backup-capabilities";

describe("backup safety", () => {
  it("does not enable simulated actions without real website access", () => {
    expect(backupPermissions("admin", WEBSITE_BACKUP_EVIDENCE, true)).toEqual({ view: true, create: false, download: false, restore: false });
  });
  it("does not claim access to Cloud backup inventory", () => {
    expect(backupPermissions("admin", DATABASE_BACKUP_EVIDENCE, true).download).toBe(false);
  });
  it("restricts backup access to administrators", () => {
    for (const role of ["manager", "editor", "customer"] as const) {
      expect(backupPermissions(role, { connected: true, verified: true, downloadable: true, restorable: true }, true)).toEqual({ view: false, create: false, download: false, restore: false });
    }
  });
  it("requires explicit confirmation before restore", () => {
    const evidence = { connected: true, verified: true, downloadable: true, restorable: true };
    expect(backupPermissions("admin", evidence).restore).toBe(false);
    expect(backupPermissions("admin", evidence, true).restore).toBe(true);
  });
  it("rejects restore from unverified backup evidence even after confirmation", () => {
    expect(backupPermissions("admin", { connected: true, verified: false, downloadable: true, restorable: true }, true).restore).toBe(false);
  });
});