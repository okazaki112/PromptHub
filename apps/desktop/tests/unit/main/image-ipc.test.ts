/**
 * @vitest-environment node
 */
import { EventEmitter } from "events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const handleMock = vi.fn();
const showOpenDialogMock = vi.fn();
const openPathMock = vi.fn();
const mkdirMock = vi.fn().mockResolvedValue(undefined);
const copyFileMock = vi.fn().mockResolvedValue(undefined);
const writeFileMock = vi.fn().mockResolvedValue(undefined);
const accessMock = vi.fn().mockResolvedValue(undefined);
const readdirMock = vi.fn().mockResolvedValue([]);
const statMock = vi.fn();
const readFileMock = vi.fn();
const unlinkMock = vi.fn();
const uuidMock = vi.fn();
const resolvePublicAddressMock = vi.fn();
const isBlockedHostnameMock = vi.fn().mockReturnValue(false);
const httpRequestMock = vi.fn();
const httpsRequestMock = vi.fn();

vi.mock("electron", () => ({
  ipcMain: {
    handle: handleMock,
  },
  dialog: {
    showOpenDialog: showOpenDialogMock,
  },
  shell: {
    openPath: openPathMock,
  },
}));

vi.mock("fs/promises", () => {
  const fsModule = {
    mkdir: mkdirMock,
    copyFile: copyFileMock,
    writeFile: writeFileMock,
    access: accessMock,
    readdir: readdirMock,
    stat: statMock,
    readFile: readFileMock,
    unlink: unlinkMock,
  };

  return {
    ...fsModule,
    default: fsModule,
  };
});

vi.mock("uuid", () => ({
  v4: uuidMock,
}));

vi.mock("http", () => ({
  default: { request: httpRequestMock },
  request: httpRequestMock,
}));

vi.mock("https", () => ({
  default: { request: httpsRequestMock },
  request: httpsRequestMock,
}));

vi.mock("../../../src/main/runtime-paths", () => ({
  getImagesDir: () => "/tmp/prompthub-images",
  getVideosDir: () => "/tmp/prompthub-videos",
}));

vi.mock("../../../src/main/services/skill-installer-remote", () => ({
  resolvePublicAddress: resolvePublicAddressMock,
  isBlockedHostname: isBlockedHostnameMock,
}));

type RegisteredHandlers = Record<string, (...args: unknown[]) => Promise<unknown>>;

function createResponse(options: {
  statusCode: number;
  headers?: Record<string, string>;
  chunks?: Buffer[];
}) {
  const response = new EventEmitter() as EventEmitter & {
    statusCode?: number;
    headers: Record<string, string>;
    resume: ReturnType<typeof vi.fn>;
    destroy: (error?: Error) => void;
  };

  response.statusCode = options.statusCode;
  response.headers = options.headers ?? {};
  response.resume = vi.fn();
  response.destroy = (error?: Error) => {
    if (error) {
      response.emit("error", error);
    }
  };

  process.nextTick(() => {
    for (const chunk of options.chunks ?? []) {
      response.emit("data", chunk);
    }
    if (options.statusCode === 200) {
      response.emit("end");
    }
  });

  return response;
}

function createRequestMock(response: ReturnType<typeof createResponse>) {
  return vi.fn((_options, callback: (response: ReturnType<typeof createResponse>) => void) => {
    const request = new EventEmitter() as EventEmitter & {
      end: () => void;
      destroy: (error?: Error) => void;
    };

    request.end = () => {
      callback(response);
    };
    request.destroy = (error?: Error) => {
      if (error) {
        request.emit("error", error);
      }
    };

    return request;
  });
}

async function setupImageIpc() {
  vi.resetModules();
  handleMock.mockReset();
  showOpenDialogMock.mockReset();
  openPathMock.mockReset();
  mkdirMock.mockClear();
  copyFileMock.mockClear();
  writeFileMock.mockClear();
  accessMock.mockClear();
  readdirMock.mockClear();
  statMock.mockClear();
  readFileMock.mockClear();
  unlinkMock.mockClear();
  uuidMock.mockReset();
  resolvePublicAddressMock.mockReset();
  isBlockedHostnameMock.mockReset();
  isBlockedHostnameMock.mockReturnValue(false);
  httpRequestMock.mockReset();
  httpsRequestMock.mockReset();

  const [{ registerImageIPC }, { IPC_CHANNELS }] = await Promise.all([
    import("../../../src/main/ipc/image.ipc"),
    import("@prompthub/shared/constants/ipc-channels"),
  ]);

  registerImageIPC();

  const handlers = Object.fromEntries(
    handleMock.mock.calls.map(([channel, handler]) => [channel, handler]),
  ) as RegisteredHandlers;

  return { handlers, IPC_CHANNELS };
}

describe("image IPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only saves image paths that came from the file picker", async () => {
    const { handlers, IPC_CHANNELS } = await setupImageIpc();
    showOpenDialogMock.mockResolvedValue({
      canceled: false,
      filePaths: ["/Users/demo/Pictures/allowed.png"],
    });
    uuidMock.mockReturnValue("saved-image");

    await expect(
      handlers[IPC_CHANNELS.DIALOG_SELECT_IMAGE](null),
    ).resolves.toEqual(["/Users/demo/Pictures/allowed.png"]);

    await expect(
      handlers[IPC_CHANNELS.IMAGE_SAVE](null, ["/Users/demo/Pictures/other.png"]),
    ).resolves.toEqual([]);
    expect(copyFileMock).not.toHaveBeenCalled();

    await expect(
      handlers[IPC_CHANNELS.DIALOG_SELECT_IMAGE](null),
    ).resolves.toEqual(["/Users/demo/Pictures/allowed.png"]);

    await expect(
      handlers[IPC_CHANNELS.IMAGE_SAVE](null, ["/Users/demo/Pictures/allowed.png"]),
    ).resolves.toEqual(["saved-image.png"]);
    expect(copyFileMock).toHaveBeenCalledWith(
      "/Users/demo/Pictures/allowed.png",
      "/tmp/prompthub-images/saved-image.png",
    );
  });

  it("only saves video paths that came from the file picker", async () => {
    const { handlers, IPC_CHANNELS } = await setupImageIpc();
    showOpenDialogMock.mockResolvedValue({
      canceled: false,
      filePaths: ["/Users/demo/Movies/allowed.mp4"],
    });
    uuidMock.mockReturnValue("saved-video");

    await expect(
      handlers[IPC_CHANNELS.DIALOG_SELECT_VIDEO](null),
    ).resolves.toEqual(["/Users/demo/Movies/allowed.mp4"]);

    await expect(
      handlers[IPC_CHANNELS.VIDEO_SAVE](null, ["/Users/demo/Movies/other.mp4"]),
    ).resolves.toEqual([]);
    expect(copyFileMock).not.toHaveBeenCalled();

    await expect(
      handlers[IPC_CHANNELS.DIALOG_SELECT_VIDEO](null),
    ).resolves.toEqual(["/Users/demo/Movies/allowed.mp4"]);

    await expect(
      handlers[IPC_CHANNELS.VIDEO_SAVE](null, ["/Users/demo/Movies/allowed.mp4"]),
    ).resolves.toEqual(["saved-video.mp4"]);
    expect(copyFileMock).toHaveBeenCalledWith(
      "/Users/demo/Movies/allowed.mp4",
      "/tmp/prompthub-videos/saved-video.mp4",
    );
  });

  it("rejects unsupported video extensions even when selected by the picker", async () => {
    const { handlers, IPC_CHANNELS } = await setupImageIpc();
    showOpenDialogMock.mockResolvedValue({
      canceled: false,
      filePaths: ["/Users/demo/Movies/not-actually-video.txt"],
    });

    await expect(
      handlers[IPC_CHANNELS.DIALOG_SELECT_VIDEO](null),
    ).resolves.toEqual(["/Users/demo/Movies/not-actually-video.txt"]);

    await expect(
      handlers[IPC_CHANNELS.VIDEO_SAVE](null, ["/Users/demo/Movies/not-actually-video.txt"]),
    ).resolves.toEqual([]);
    expect(copyFileMock).not.toHaveBeenCalled();
  });

  it("blocks redirected downloads before writing files when the target host is not public", async () => {
    const { handlers, IPC_CHANNELS } = await setupImageIpc();
    uuidMock.mockReturnValue("downloaded-image");
    resolvePublicAddressMock.mockImplementation(async (hostname: string) => {
      if (hostname === "blocked.test") {
        throw new Error("Access to internal network addresses is not allowed");
      }
      return { address: "203.0.113.10", family: 4 };
    });

    httpsRequestMock.mockImplementation(
      createRequestMock(
        createResponse({
          statusCode: 302,
          headers: {
            location: "https://blocked.test/private.png",
          },
        }),
      ),
    );

    await expect(
      handlers[IPC_CHANNELS.IMAGE_DOWNLOAD](
        null,
        "https://example.com/wallpaper.png",
      ),
    ).resolves.toBeNull();

    expect(resolvePublicAddressMock.mock.calls.map(([hostname]) => hostname)).toEqual(
      ["example.com", "example.com", "blocked.test"],
    );
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});
