/**
 * @vitest-environment node
 */
import os from "os";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const handleMock = vi.fn();
const showSaveDialogMock = vi.fn();
const zipSyncMock = vi.fn(() => new Uint8Array([7, 7, 7]));
const strToU8Mock = vi.fn((text: string) => new Uint8Array(Buffer.from(text)));
const writeFileSyncMock = vi.fn();

const ROOT = path.resolve(os.tmpdir(), "prompthub-data-export-ipc-test");
const IMAGES_DIR = path.join(ROOT, "data", "assets", "images");
const VIDEOS_DIR = path.join(ROOT, "data", "assets", "videos");
const PROMPTS_DIR = path.join(ROOT, "data", "prompts");
const WORKSPACE_DIR = path.join(ROOT, "data", "workspace");
const SKILLS_DIR = path.join(ROOT, "data", "skills");
const RULES_DIR = path.join(ROOT, "data", "rules");
const CONFIG_DIR = path.join(ROOT, "config");

interface FakeEntry {
  content?: string;
  isDirectory?: boolean;
}

let entries = new Map<string, FakeEntry>();

function addFile(filePath: string, content = "bytes"): void {
  entries.set(path.resolve(filePath), { content });
}

function addDir(dirPath: string): void {
  entries.set(path.resolve(dirPath), { isDirectory: true });
}

function isFileEntry(filePath: string): boolean {
  return entries.get(path.resolve(filePath))?.content !== undefined;
}

function isDirEntry(filePath: string): boolean {
  return entries.get(path.resolve(filePath))?.isDirectory === true;
}

function childNamesOf(dirPath: string): string[] {
  const parent = path.resolve(dirPath);
  return [...entries.keys()]
    .filter((key) => path.dirname(key) === parent)
    .map((key) => path.basename(key));
}

vi.mock("electron", () => ({
  ipcMain: { handle: handleMock },
  dialog: { showSaveDialog: showSaveDialogMock },
}));

vi.mock("fs", () => {
  const fsModule = {
    existsSync: (filePath: string) => entries.has(path.resolve(filePath)),
    statSync: (filePath: string) => ({
      isFile: () => isFileEntry(filePath),
      isDirectory: () => isDirEntry(filePath),
    }),
    readFileSync: (filePath: string) =>
      Buffer.from(entries.get(path.resolve(filePath))?.content ?? "missing"),
    readdirSync: (dirPath: string) =>
      childNamesOf(dirPath).map((name) => ({
        name,
        isDirectory: () => isDirEntry(path.join(dirPath, name)),
        isFile: () => isFileEntry(path.join(dirPath, name)),
      })),
    writeFileSync: writeFileSyncMock,
  };

  return { ...fsModule, default: fsModule };
});

vi.mock("fflate", () => ({
  zipSync: zipSyncMock,
  strToU8: strToU8Mock,
}));

vi.mock("../../../src/main/runtime-paths", () => ({
  getImagesDir: () => IMAGES_DIR,
  getVideosDir: () => VIDEOS_DIR,
  getPromptsWorkspaceDir: () => PROMPTS_DIR,
  getWorkspaceDir: () => WORKSPACE_DIR,
  getSkillsDir: () => SKILLS_DIR,
  getRulesDir: () => RULES_DIR,
  getConfigDir: () => CONFIG_DIR,
}));

interface ExportZipResponse {
  canceled: boolean;
  filePath?: string;
  error?: string;
}

type InvokeExport = (scope: Record<string, unknown>) => Promise<ExportZipResponse>;

async function setupExportInvoker(): Promise<InvokeExport> {
  vi.resetModules();
  vi.clearAllMocks();
  handleMock.mockImplementation(() => undefined);
  showSaveDialogMock.mockResolvedValue({
    canceled: false,
    filePath: path.join(ROOT, "prompthub-export.zip"),
  });
  zipSyncMock.mockReturnValue(new Uint8Array([7, 7, 7]));

  const { registerDataExportIPC } = await import(
    "../../../src/main/ipc/data-export.ipc"
  );

  registerDataExportIPC();

  const handlers = new Map<string, ExportHandler>();
  for (const [channel, handler] of handleMock.mock.calls as Array<
    [string, ExportHandler]
  >) {
    handlers.set(channel, handler);
  }

  const handler = handlers.get("data:exportZip");
  if (!handler) {
    throw new Error("data:exportZip handler was not registered");
  }

  return (scope) => handler(null, { scope });
}

type ExportHandler = (
  event: unknown,
  params: { scope: Record<string, unknown> },
) => Promise<ExportZipResponse>;

function zippedPaths(): string[] {
  const zipFiles = zipSyncMock.mock.calls[0]?.[0] as Record<string, unknown>;
  return Object.keys(zipFiles).sort();
}

function fullScope(overrides: Record<string, unknown> = {}) {
  return {
    prompts: false,
    versions: false,
    images: false,
    videos: false,
    skills: false,
    rules: false,
    config: false,
    ...overrides,
  };
}

describe("data export IPC", () => {
  beforeEach(() => {
    entries = new Map();
    addDir(IMAGES_DIR);
    addDir(VIDEOS_DIR);
    addDir(PROMPTS_DIR);
    addDir(path.join(WORKSPACE_DIR, ".versions"));
    addDir(SKILLS_DIR);
    addDir(RULES_DIR);
    addDir(CONFIG_DIR);
  });

  it("packs only the images named by the export scope", async () => {
    const invoke = await setupExportInvoker();
    addFile(path.join(IMAGES_DIR, "referenced.png"));
    addFile(path.join(IMAGES_DIR, "background.png"));
    addFile(path.join(IMAGES_DIR, "stale-leftover.png"));

    await expect(
      invoke(fullScope({ images: true, imageFileNames: ["referenced.png"] })),
    ).resolves.toMatchObject({ canceled: false });

    expect(zippedPaths()).toEqual(["images/referenced.png"]);
  });

  it("packs the background image only when its own scope flag is enabled", async () => {
    const invoke = await setupExportInvoker();
    addFile(path.join(IMAGES_DIR, "referenced.png"));
    addFile(path.join(IMAGES_DIR, "background.png"));
    const base = fullScope({
      images: true,
      imageFileNames: ["referenced.png"],
      backgroundImageFileName: "background.png",
    });

    await invoke({ ...base, backgroundImage: false });
    expect(zippedPaths()).toEqual(["images/referenced.png"]);

    zipSyncMock.mockClear();
    await invoke({ ...base, backgroundImage: true });
    expect(zippedPaths()).toEqual([
      "images/background.png",
      "images/referenced.png",
    ]);
  });

  it("ignores the background scope flag when no background file is selected", async () => {
    const invoke = await setupExportInvoker();
    addFile(path.join(IMAGES_DIR, "referenced.png"));

    await invoke(
      fullScope({
        images: true,
        imageFileNames: ["referenced.png"],
        backgroundImage: true,
      }),
    );

    expect(zippedPaths()).toEqual(["images/referenced.png"]);
  });

  it("rejects image names that are not bare basenames or are absent on disk", async () => {
    const invoke = await setupExportInvoker();
    addFile(path.join(ROOT, "escaped.png"));
    const rejectedNames = [
      "",
      "../escaped.png",
      "nested/deep.png",
      "nested\\deep.png",
      "bad\0name.png",
      path.join(ROOT, "escaped.png"),
      "missing.png",
    ];

    await expect(
      invoke(fullScope({ images: true, imageFileNames: rejectedNames })),
    ).resolves.toMatchObject({ canceled: false });

    expect(zipSyncMock).toHaveBeenCalledTimes(1);
    expect(zippedPaths()).toEqual([]);
  });

  it("keeps directory sections recursive while videos stay whole-directory copies", async () => {
    const invoke = await setupExportInvoker();
    addDir(path.join(PROMPTS_DIR, "sub"));
    addFile(path.join(PROMPTS_DIR, "root.md"));
    addFile(path.join(PROMPTS_DIR, "sub", "nested.md"));
    addFile(path.join(WORKSPACE_DIR, ".versions", "0001.md"));
    addFile(path.join(SKILLS_DIR, "SKILL.md"));
    addFile(path.join(RULES_DIR, "rule.md"));
    addFile(path.join(VIDEOS_DIR, "clip.mp4"));
    addFile(path.join(VIDEOS_DIR, "unused-clip.mp4"));

    await invoke(
      fullScope({
        prompts: true,
        versions: true,
        skills: true,
        rules: true,
        videos: true,
        config: true,
      }),
    );

    expect(zippedPaths()).toEqual([
      "prompts/root.md",
      "prompts/sub/nested.md",
      "rules/rule.md",
      "skills/SKILL.md",
      "versions/0001.md",
      "videos/clip.mp4",
      "videos/unused-clip.mp4",
    ]);
  });

  it("writes embedded json payloads only when provided", async () => {
    const invoke = await setupExportInvoker();

    await invoke(
      fullScope({ exportJson: "{}", settingsJson: '{"a":1}' }),
    );

    expect(zippedPaths()).toEqual([
      "import-with-prompthub.json",
      "settings.json",
    ]);
  });

  it("returns canceled without building an archive when the dialog is canceled", async () => {
    const invoke = await setupExportInvoker();
    showSaveDialogMock.mockResolvedValue({ canceled: true });

    await expect(invoke(fullScope({ images: true }))).resolves.toEqual({
      canceled: true,
    });
    expect(zipSyncMock).not.toHaveBeenCalled();
    expect(writeFileSyncMock).not.toHaveBeenCalled();
  });

  it("returns a structured error when the archive cannot be written", async () => {
    const invoke = await setupExportInvoker();
    writeFileSyncMock.mockImplementation(() => {
      throw new Error("ENOSPC no space left on device");
    });

    await expect(invoke(fullScope())).resolves.toEqual({
      canceled: false,
      error: "ENOSPC no space left on device",
    });
  });
});
