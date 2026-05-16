import { ipcMain } from "electron";
import { IPC_CHANNELS } from "@prompthub/shared/constants";
import type { CliInstallMethod } from "@prompthub/shared/types";
import { getCliStatus, installCli } from "../services/cli-installer";

export function registerCliIPC(): void {
  ipcMain.handle(IPC_CHANNELS.CLI_STATUS, async () => getCliStatus());

  ipcMain.handle(
    IPC_CHANNELS.CLI_INSTALL,
    async (_event, method?: CliInstallMethod) => installCli(method),
  );
}
