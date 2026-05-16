export interface ManualBackupStatus {
  lastManualBackupAt: string | null;
  lastManualBackupVersion: string | null;
}

export async function getManualBackupStatus(): Promise<ManualBackupStatus> {
  const settings = await window.api?.settings?.get?.();

  return {
    lastManualBackupAt:
      typeof settings?.lastManualBackupAt === "string"
        ? settings.lastManualBackupAt
        : null,
    lastManualBackupVersion:
      typeof settings?.lastManualBackupVersion === "string"
        ? settings.lastManualBackupVersion
        : null,
  };
}

export async function recordManualBackup(
  currentVersion: string,
  timestamp = new Date().toISOString(),
): Promise<ManualBackupStatus> {
  await window.api?.settings?.set?.({
    lastManualBackupAt: timestamp,
    lastManualBackupVersion: currentVersion,
  });

  return {
    lastManualBackupAt: timestamp,
    lastManualBackupVersion: currentVersion,
  };
}
