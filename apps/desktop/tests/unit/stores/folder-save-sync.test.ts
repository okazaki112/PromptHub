import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/renderer/services/webdav-save-sync", () => ({
  scheduleAllSaveSync: vi.fn(),
}));

vi.mock("../../../src/renderer/services/database", () => ({
  createFolder: vi.fn(),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
  updateFolderOrders: vi.fn(),
  getAllFolders: vi.fn().mockResolvedValue([]),
}));

import { scheduleAllSaveSync } from "../../../src/renderer/services/webdav-save-sync";
import * as db from "../../../src/renderer/services/database";
import { useFolderStore } from "../../../src/renderer/stores/folder.store";

describe("folder store save-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFolderStore.setState({
      folders: [],
      selectedFolderId: null,
      expandedIds: new Set(),
      unlockedFolderIds: new Set(),
    });
  });

  it("schedules save-sync when creating a folder", async () => {
    vi.mocked(db.createFolder).mockResolvedValue({
      id: "folder-1",
      name: "Folder",
      icon: "📁",
      order: 0,
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-11T00:00:00.000Z",
    } as never);

    await useFolderStore.getState().createFolder({
      name: "Folder",
      icon: "📁",
    });

    expect(scheduleAllSaveSync).toHaveBeenCalledWith("folder:create");
  });

  it("schedules save-sync after reorder succeeds", async () => {
    useFolderStore.setState({
      folders: [
        {
          id: "folder-1",
          name: "One",
          icon: "📁",
          order: 0,
          createdAt: "2026-05-11T00:00:00.000Z",
          updatedAt: "2026-05-11T00:00:00.000Z",
        },
        {
          id: "folder-2",
          name: "Two",
          icon: "📁",
          order: 1,
          createdAt: "2026-05-11T00:00:00.000Z",
          updatedAt: "2026-05-11T00:00:00.000Z",
        },
      ],
    });
    vi.mocked(db.updateFolderOrders).mockResolvedValue(undefined as never);

    await useFolderStore.getState().reorderFolders(["folder-2", "folder-1"]);

    expect(scheduleAllSaveSync).toHaveBeenCalledWith("folder:reorder");
  });
});
