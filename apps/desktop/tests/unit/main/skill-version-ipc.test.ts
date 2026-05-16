import { beforeEach, describe, expect, it, vi } from "vitest";

const handleMock = vi.fn();
const deleteAllLocalReposMock = vi.fn().mockResolvedValue(undefined);

vi.mock("electron", () => ({
  ipcMain: {
    handle: handleMock,
  },
}));

vi.mock("../../../src/main/services/skill-installer", () => ({
  SkillInstaller: {
    deleteAllLocalRepos: deleteAllLocalReposMock,
  },
}));

type RegisteredHandlers = Record<string, (...args: unknown[]) => unknown>;

function createSkillDbMock() {
  return {
    getVersions: vi.fn().mockReturnValue([]),
    getVersion: vi.fn().mockReturnValue(null),
    getById: vi.fn().mockReturnValue(null),
    createVersion: vi.fn(),
    update: vi.fn(),
    deleteVersion: vi.fn(),
    deleteAll: vi.fn(),
    insertVersionDirect: vi.fn(),
  };
}

async function setupSkillVersionIpc() {
  vi.resetModules();
  handleMock.mockReset();
  deleteAllLocalReposMock.mockClear();

  const [{ registerSkillVersionHandlers }, { IPC_CHANNELS }] = await Promise.all([
    import("../../../src/main/ipc/skill/version-handlers"),
    import("@prompthub/shared/constants/ipc-channels"),
  ]);

  const db = createSkillDbMock();
  registerSkillVersionHandlers({ db } as never);

  const handlers = Object.fromEntries(
    handleMock.mock.calls.map(([channel, handler]) => [channel, handler]),
  ) as RegisteredHandlers;

  return { db, handlers, IPC_CHANNELS };
}

describe("skill version IPC", () => {
  beforeEach(() => {
    handleMock.mockReset();
    deleteAllLocalReposMock.mockClear();
  });

  it("accepts ISO createdAt values for direct version restore", async () => {
    const { db, handlers, IPC_CHANNELS } = await setupSkillVersionIpc();

    const version = {
      id: "version-1",
      skillId: "skill-1",
      version: 2,
      content: "# Skill",
      filesSnapshot: [{ relativePath: "SKILL.md", content: "# Skill" }],
      createdAt: "2026-04-16T10:20:30.000Z",
    };

    await expect(
      handlers[IPC_CHANNELS.SKILL_INSERT_VERSION_DIRECT](null, version),
    ).resolves.toBeUndefined();

    expect(db.insertVersionDirect).toHaveBeenCalledWith(version);
  });

  it("rejects invalid createdAt values for direct version restore", async () => {
    const { handlers, IPC_CHANNELS } = await setupSkillVersionIpc();

    await expect(
      handlers[IPC_CHANNELS.SKILL_INSERT_VERSION_DIRECT](null, {
        id: "version-1",
        skillId: "skill-1",
        version: 2,
        createdAt: "not-a-date",
      }),
    ).rejects.toThrow(
      "skill:insertVersionDirect requires createdAt to be a valid ISO date string or finite timestamp",
    );
  });
});
