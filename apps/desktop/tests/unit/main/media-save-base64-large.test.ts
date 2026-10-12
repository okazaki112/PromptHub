/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IPC_CHANNELS } from "@prompthub/shared/constants/ipc-channels";

const handleMock = vi.fn();
const mkdirMock = vi.fn().mockResolvedValue(undefined);
const writeFileMock = vi.fn().mockResolvedValue(undefined);
const accessMock = vi.fn().mockRejectedValue(new Error("ENOENT"));

vi.mock("electron", () => ({
  ipcMain: { handle: handleMock },
  dialog: { showOpenDialog: vi.fn() },
  shell: { openPath: vi.fn() },
}));

vi.mock("fs/promises", () => {
  const fsModule = {
    mkdir: mkdirMock,
    writeFile: writeFileMock,
    access: accessMock,
    readdir: vi.fn().mockResolvedValue([]),
    stat: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue(undefined),
  };

  return { ...fsModule, default: fsModule };
});

vi.mock("uuid", () => ({ v4: vi.fn(() => "generated-id") }));

vi.mock("http", () => ({
  default: { request: vi.fn() },
  request: vi.fn(),
}));

vi.mock("https", () => ({
  default: { request: vi.fn() },
  request: vi.fn(),
}));

vi.mock("../../../src/main/runtime-paths", () => ({
  getImagesDir: () => "/tmp/prompthub-images",
  getVideosDir: () => "/tmp/prompthub-videos",
}));

vi.mock("../../../src/main/services/skill-installer-remote", () => ({
  resolvePublicAddress: vi.fn(),
  isBlockedHostname: vi.fn().mockReturnValue(false),
}));

type MediaHandler = (
  event: unknown,
  fileName: string,
  base64Data: string,
) => Promise<boolean>;

async function registerMediaHandlers(): Promise<Record<string, MediaHandler>> {
  vi.resetModules();
  handleMock.mockReset();

  const { registerImageIPC } = await import("../../../src/main/ipc/image.ipc");

  registerImageIPC();

  return Object.fromEntries(
    handleMock.mock.calls.map(([channel, handler]) => [channel, handler]),
  ) as Record<string, MediaHandler>;
}

describe("media base64 restore limits", () => {
  beforeEach(() => {
    writeFileMock.mockClear();
    accessMock.mockRejectedValue(new Error("ENOENT"));
  });

  it("restores a multi-megabyte image payload without exhausting the stack", async () => {
    const handlers = await registerMediaHandlers();
    const content = Buffer.alloc(3_500_315, 7);

    const saved = await handlers[IPC_CHANNELS.IMAGE_SAVE_BASE64](
      null,
      "background.png",
      content.toString("base64"),
    );

    expect(saved).toBe(true);
    const written = writeFileMock.mock.calls.at(-1)?.[1] as Buffer;
    // Buffer.compare avoids the deep structural walk that toEqual performs on
    // multi-megabyte buffers.
    expect(Buffer.compare(written, content)).toBe(0);
  });

  it("restores a multi-megabyte video payload", async () => {
    const handlers = await registerMediaHandlers();
    const content = Buffer.alloc(3_500_315, 11);

    const saved = await handlers[IPC_CHANNELS.VIDEO_SAVE_BASE64](
      null,
      "clip.mp4",
      content.toString("base64"),
    );

    expect(saved).toBe(true);
    expect(
      writeFileMock.mock.calls.some(
        ([, buffer]) => (buffer as Buffer).byteLength === content.byteLength,
      ),
    ).toBe(true);
  });

  it("still rejects payloads that are not valid base64", async () => {
    const handlers = await registerMediaHandlers();

    const saved = await handlers[IPC_CHANNELS.IMAGE_SAVE_BASE64](
      null,
      "broken.png",
      "!!!!not-base64!!!!",
    );

    expect(saved).toBe(false);
    expect(
      writeFileMock.mock.calls.some(
        ([, buffer]) => (buffer as Buffer).byteLength > 0,
      ),
    ).toBe(false);
  });

  it("still rejects empty media payloads", async () => {
    const handlers = await registerMediaHandlers();

    await expect(
      handlers[IPC_CHANNELS.IMAGE_SAVE_BASE64](null, "empty.png", ""),
    ).resolves.toBe(false);
  });
});
