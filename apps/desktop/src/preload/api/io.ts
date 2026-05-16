import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@prompthub/shared/constants/ipc-channels";

export const ioApi = {
  export: (ids: string[]) => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_PROMPTS, ids),
  import: (data: string) => ipcRenderer.invoke(IPC_CHANNELS.IMPORT_PROMPTS, data),
};
