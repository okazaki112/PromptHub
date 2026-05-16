import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const handleMock = vi.fn();

vi.mock("electron", () => ({
  ipcMain: {
    handle: handleMock,
  },
}));

type SecurityModule = typeof import("../../../src/main/security");
type SecurityHandlers = Record<string, (...args: unknown[]) => unknown>;

function createMockDb() {
  const store = new Map<string, string>();
  return {
    prepare: vi.fn((sql: string) => {
      if (sql.includes("SELECT")) {
        return {
          get: vi.fn((...args: string[]) => {
            const key = Array.isArray(args[0]) ? args[0][0] : args[0];
            const val = store.get(key);
            return val ? { value: val } : undefined;
          }),
        };
      }
      if (sql.includes("INSERT OR REPLACE")) {
        return {
          run: vi.fn((...args: unknown[]) => {
            const params = Array.isArray(args[0]) ? args[0] : args;
            store.set(params[0] as string, params[1] as string);
          }),
        };
      }
      return { get: vi.fn(), run: vi.fn() };
    }),
    _store: store,
  } as unknown as import("../../../src/main/database/sqlite").default.Database;
}

async function setupSecurityIpc() {
  vi.resetModules();
  handleMock.mockReset();

  const [{ registerSecurityIPC }, { IPC_CHANNELS }, security] =
    await Promise.all([
      import("../../../src/main/ipc/security.ipc"),
      import("@prompthub/shared/constants/ipc-channels"),
      import("../../../src/main/security"),
    ]);

  const db = createMockDb();
  registerSecurityIPC(db);

  const handlers = Object.fromEntries(
    handleMock.mock.calls.map(([channel, handler]) => [channel, handler]),
  ) as SecurityHandlers;

  return { db, handlers, IPC_CHANNELS, security: security as SecurityModule };
}

describe("security IPC", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    handleMock.mockReset();
    consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("rejects setting a short master password", async () => {
    const { handlers, IPC_CHANNELS } = await setupSecurityIpc();

    await expect(
      handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "123"),
    ).rejects.toThrow("Password too short");
  });

  it("sets the initial master password and reports unlocked status", async () => {
    const { handlers, IPC_CHANNELS } = await setupSecurityIpc();

    await expect(
      handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "abcd1234"),
    ).resolves.toEqual({
      configured: true,
      unlocked: true,
    });
  });

  it("rejects resetting master password through the initial setup handler", async () => {
    const { handlers, IPC_CHANNELS } = await setupSecurityIpc();

    await handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "abcd1234");

    await expect(
      handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "next-pass"),
    ).rejects.toThrow("Master password is already configured");
  });

  it("rejects change password when security is not configured", async () => {
    const { handlers, IPC_CHANNELS } = await setupSecurityIpc();

    await expect(
      handlers[IPC_CHANNELS.SECURITY_CHANGE_MASTER_PASSWORD](
        null,
        "old-pass",
        "new-pass",
      ),
    ).rejects.toThrow("Master password is not configured");
  });

  it("rejects change password with missing current password", async () => {
    const { handlers, IPC_CHANNELS } = await setupSecurityIpc();
    await handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "abcd1234");

    await expect(
      handlers[IPC_CHANNELS.SECURITY_CHANGE_MASTER_PASSWORD](
        null,
        "",
        "new-pass",
      ),
    ).rejects.toThrow("Current password is required");
  });

  it("rejects change password with a short new password", async () => {
    const { handlers, IPC_CHANNELS } = await setupSecurityIpc();
    await handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "abcd1234");

    await expect(
      handlers[IPC_CHANNELS.SECURITY_CHANGE_MASTER_PASSWORD](
        null,
        "abcd1234",
        "123",
      ),
    ).rejects.toThrow("Password too short");
  });

  it("does not change password when current password is wrong", async () => {
    const { handlers, IPC_CHANNELS, security, db } = await setupSecurityIpc();
    await handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "abcd1234");
    await handlers[IPC_CHANNELS.SECURITY_LOCK](null);

    await expect(
      handlers[IPC_CHANNELS.SECURITY_CHANGE_MASTER_PASSWORD](
        null,
        "wrong-pass",
        "new-pass",
      ),
    ).rejects.toThrow("Current password is incorrect");

    expect(security.unlock(db, "abcd1234")).toBe(true);
    security.lock();
    expect(security.unlock(db, "new-pass")).toBe(false);
  });

  it("changes password when current password is correct", async () => {
    const { handlers, IPC_CHANNELS, security, db } = await setupSecurityIpc();
    await handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "abcd1234");
    await handlers[IPC_CHANNELS.SECURITY_LOCK](null);

    await expect(
      handlers[IPC_CHANNELS.SECURITY_CHANGE_MASTER_PASSWORD](
        null,
        "abcd1234",
        "new-pass",
      ),
    ).resolves.toEqual({
      configured: true,
      unlocked: true,
    });

    security.lock();
    expect(security.unlock(db, "abcd1234")).toBe(false);
    expect(security.unlock(db, "new-pass")).toBe(true);
  });

  it("returns success false and unlocked false on failed unlock", async () => {
    const { handlers, IPC_CHANNELS } = await setupSecurityIpc();
    await handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "abcd1234");
    await handlers[IPC_CHANNELS.SECURITY_LOCK](null);

    await expect(
      handlers[IPC_CHANNELS.SECURITY_UNLOCK](null, "wrong-pass"),
    ).resolves.toEqual({
      success: false,
      configured: true,
      unlocked: false,
    });
  });

  it("fails closed when the stored password payload is corrupted", async () => {
    const { handlers, IPC_CHANNELS, db } = await setupSecurityIpc();
    (db as any)._store.set(
      "master_password",
      JSON.stringify({ salt: "bad", hash: "bad" }),
    );

    await expect(handlers[IPC_CHANNELS.SECURITY_STATUS](null)).resolves.toEqual(
      {
        configured: false,
        unlocked: false,
      },
    );
    await expect(
      handlers[IPC_CHANNELS.SECURITY_UNLOCK](null, "anything"),
    ).resolves.toEqual({
      success: false,
      configured: false,
      unlocked: false,
    });
    await expect(
      handlers[IPC_CHANNELS.SECURITY_CHANGE_MASTER_PASSWORD](
        null,
        "old-pass",
        "new-pass",
      ),
    ).rejects.toThrow("Master password is not configured");
  });

  it("locks and reports unlocked false", async () => {
    const { handlers, IPC_CHANNELS } = await setupSecurityIpc();
    await handlers[IPC_CHANNELS.SECURITY_SET_MASTER_PASSWORD](null, "abcd1234");

    await expect(handlers[IPC_CHANNELS.SECURITY_LOCK](null)).resolves.toEqual({
      configured: true,
      unlocked: false,
    });
  });
});
