export type CliInstallMethod = "pnpm" | "npm";

export interface CliStatus {
  installed: boolean;
  command: string;
  version: string | null;
  packageManager: CliInstallMethod | null;
  packageManagerVersion: string | null;
  releaseTag: string;
  installCommand: string | null;
  installSource: string;
  error?: string;
}

export interface CliInstallResult {
  success: boolean;
  method: CliInstallMethod;
  command: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}
