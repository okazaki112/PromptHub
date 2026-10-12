import path from "path";
import fs from "fs";
import { dialog, ipcMain } from "electron";
import { IPC_CHANNELS } from "@prompthub/shared/constants/ipc-channels";
import type {
  ExportZipResult,
  ExportZipScope,
} from "@prompthub/shared/types";
import {
  getConfigDir,
  getImagesDir,
  getPromptsWorkspaceDir,
  getRulesDir,
  getSkillsDir,
  getVideosDir,
  getWorkspaceDir,
} from "../runtime-paths";

type ZipFiles = Record<string, [Uint8Array, { level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }]>;

/**
 * Exported file names arrive from the renderer. Image and video assets are
 * stored flat, so only bare basenames are accepted and resolved inside the
 * asset directory.
 */
function resolveAssetPath(baseDir: string, fileName: string): string | null {
  if (typeof fileName !== "string" || fileName.length === 0) {
    return null;
  }
  if (fileName.includes("\0") || fileName !== path.basename(fileName)) {
    return null;
  }

  const resolved = path.resolve(baseDir, fileName);
  const relative = path.relative(baseDir, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return resolved;
}

function addNamedAssetFiles(
  zipFiles: ZipFiles,
  baseDir: string,
  zipPrefix: string,
  fileNames: readonly string[],
): void {
  for (const fileName of fileNames) {
    const source = resolveAssetPath(baseDir, fileName);
    if (!source || !fs.existsSync(source) || !fs.statSync(source).isFile()) {
      continue;
    }
    zipFiles[`${zipPrefix}${fileName}`] = [fs.readFileSync(source), { level: 1 }];
  }
}

function collectDirFiles(zipFiles: ZipFiles, srcDir: string, zipPrefix: string): void {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const fullPath = path.join(srcDir, entry.name);
    const zipPath = `${zipPrefix}${entry.name}`;
    if (entry.isDirectory()) {
      collectDirFiles(zipFiles, fullPath, `${zipPath}/`);
    } else if (entry.isFile()) {
      zipFiles[zipPath] = [fs.readFileSync(fullPath), { level: 1 }];
    }
  }
}

export function registerDataExportIPC(): void {
  ipcMain.handle(
    IPC_CHANNELS.DATA_EXPORT_ZIP,
    async (
      _event,
      params: { scope: ExportZipScope },
    ): Promise<ExportZipResult> => {
      try {
        const { zipSync, strToU8 } = await import("fflate");
        const dateStr = new Date().toISOString().split("T")[0];
        const { canceled, filePath } = await dialog.showSaveDialog({
          title: "导出数据",
          defaultPath: `prompthub-export-${dateStr}.zip`,
          filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
        });
        if (canceled || !filePath) {
          return { canceled: true };
        }

        const zipFiles: ZipFiles = {};
        const { scope } = params;

        if (scope.prompts) {
          collectDirFiles(zipFiles, getPromptsWorkspaceDir(), "prompts/");
        }
        if (scope.versions) {
          collectDirFiles(
            zipFiles,
            path.join(getWorkspaceDir(), ".versions"),
            "versions/",
          );
        }
        if (scope.skills) {
          collectDirFiles(zipFiles, getSkillsDir(), "skills/");
        }
        if (scope.rules) {
          collectDirFiles(zipFiles, getRulesDir(), "rules/");
        }
        if (scope.images) {
          addNamedAssetFiles(
            zipFiles,
            getImagesDir(),
            "images/",
            scope.imageFileNames ?? [],
          );
        }
        if (scope.backgroundImage && scope.backgroundImageFileName) {
          addNamedAssetFiles(zipFiles, getImagesDir(), "images/", [
            scope.backgroundImageFileName,
          ]);
        }
        if (scope.videos) {
          collectDirFiles(zipFiles, getVideosDir(), "videos/");
        }
        if (scope.config) {
          collectDirFiles(zipFiles, getConfigDir(), "config/");
        }
        if (scope.aiConfigJson) {
          zipFiles["ai-config.json"] = [strToU8(scope.aiConfigJson), { level: 1 }];
        }
        if (scope.settingsJson) {
          zipFiles["settings.json"] = [strToU8(scope.settingsJson), { level: 1 }];
        }
        if (scope.exportJson) {
          zipFiles["import-with-prompthub.json"] = [
            strToU8(scope.exportJson),
            { level: 1 },
          ];
        }

        fs.writeFileSync(filePath, zipSync(zipFiles));
        return { canceled: false, filePath };
      } catch (error) {
        return {
          canceled: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
}
