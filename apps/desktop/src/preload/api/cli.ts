import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@prompthub/shared/constants/ipc-channels";
import type { CliInstallMethod, CliInstallResult, CliStatus } from "@prompthub/shared/types";

export const cliApi = {
  getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.CLI_STATUS) as Promise<CliStatus>,
  install: (method?: CliInstallMethod) =>
    ipcRenderer.invoke(IPC_CHANNELS.CLI_INSTALL, method) as Promise<CliInstallResult>,
};
