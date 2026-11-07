import { describe, expect, it } from "vitest";
import { backupPermissions, WEBSITE_BACKUP_EVIDENCE, DATABASE_BACKUP_EVIDENCE, isRestoreConfirmed, snapshotEvidence } from "./backup-capabilities";

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
describe("database snapshot rules", () => {
  it("only accepts the exact word RIKTHE as restore confirmation", () => {
    expect(isRestoreConfirmed("RIKTHE")).toBe(true);
    expect(isRestoreConfirmed("rikthe")).toBe(false);
    expect(isRestoreConfirmed("")).toBe(false);
  });
  it("does not allow download or restore of a snapshot that is not verified", () => {
    const p = backupPermissions("admin", snapshotEvidence({ status: "created", photos_status: "pending" }), true);
    expect(p.download).toBe(false);
    expect(p.restore).toBe(false);
  });
  it("does not allow restore when photos are incomplete", () => {
    expect(backupPermissions("admin", snapshotEvidence({ status: "verified", photos_status: "incomplete" }), true).restore).toBe(false);
  });
  it("allows admin restore of a verified snapshot only after confirmation", () => {
    const e = snapshotEvidence({ status: "verified", photos_status: "verified" });
    expect(backupPermissions("admin", e, false).restore).toBe(false);
    expect(backupPermissions("admin", e, true).restore).toBe(true);
    expect(backupPermissions("manager", e, true).restore).toBe(false);
  });
});
