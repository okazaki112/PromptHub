import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpdateDialog, type UpdateStatus } from "../../../src/renderer/components/UpdateDialog";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";

const useSettingsStoreMock = vi.fn();
const runPreUpgradeBackupMock = vi.fn();
const getManualBackupStatusMock = vi.fn();

vi.mock("../../../src/renderer/stores/settings.store", () => ({
  useSettingsStore: (
    selector: (state: { useUpdateMirror: boolean; updateChannel: string }) => unknown,
  ) =>
    selector(useSettingsStoreMock()),
}));

vi.mock("../../../src/renderer/services/backup-status", () => ({
  getManualBackupStatus: () => getManualBackupStatusMock(),
}));

vi.mock("../../../src/renderer/services/backup-orchestrator", () => ({
  runPreUpgradeBackup: (version: string) => runPreUpgradeBackupMock(version),
}));

describe("UpdateDialog", () => {
  const availableStatus: UpdateStatus = {
    status: "available",
    info: {
      version: "0.5.2",
      releaseNotes: "## Fixes",
    },
  };
  const downloadedStatus: UpdateStatus = {
    status: "downloaded",
    info: {
      version: "0.5.2",
      releaseNotes: "## Fixes",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStoreMock.mockReturnValue({
      useUpdateMirror: false,
      updateChannel: "stable",
    });
    getManualBackupStatusMock.mockResolvedValue({
      lastManualBackupAt: null,
      lastManualBackupVersion: null,
    });
    runPreUpgradeBackupMock.mockResolvedValue({
      lastManualBackupAt: "2026-04-13T10:00:00.000Z",
      lastManualBackupVersion: "0.5.1",
    });

    installWindowMocks({
      electron: {
        updater: {
          check: vi.fn().mockResolvedValue({ success: true }),
          download: vi.fn().mockResolvedValue(undefined),
          install: vi.fn().mockResolvedValue({ success: true }),
          getVersion: vi.fn().mockResolvedValue("0.5.1"),
          getPlatform: vi.fn().mockResolvedValue("win32"),
          onStatus: vi.fn((callback: (status: UpdateStatus) => void) => {
            callback(availableStatus);
            return vi.fn();
          }),
        },
      },
    });
  });

  it("keeps download enabled because install creates an automatic data snapshot", async () => {
    await act(async () => {
      await renderWithI18n(
        <UpdateDialog isOpen={true} onClose={vi.fn()} initialStatus={availableStatus} />,
        { language: "en" },
      );
    });

    const downloadButton = await screen.findByRole("button", {
      name: "Download Update",
    });
    expect(downloadButton).not.toBeDisabled();
    expect(
      screen.getByText("Manual backup is required before in-app upgrade"),
    ).toBeInTheDocument();
    expect(screen.getByText("Release Notes")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Confirm the backup acknowledgement before continuing with the upgrade.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "I have backed up the relevant data and understand the app will close during installation.",
      ),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Full Backup",
      }),
    );

    await waitFor(() => {
      expect(runPreUpgradeBackupMock).toHaveBeenCalledTimes(1);
      expect(runPreUpgradeBackupMock).toHaveBeenCalledWith("0.5.1");
    });

    await waitFor(() => {
      expect(downloadButton).not.toBeDisabled();
    });
  });

  it("hides install backup gating for Homebrew-managed available updates", async () => {
    installWindowMocks({
      electron: {
        updater: {
          check: vi.fn().mockResolvedValue({ success: true }),
          download: vi.fn().mockResolvedValue(undefined),
          install: vi.fn().mockResolvedValue({ success: true }),
          getVersion: vi.fn().mockResolvedValue("0.5.1"),
          getPlatform: vi.fn().mockResolvedValue("darwin"),
          getInstallSource: vi.fn().mockResolvedValue("homebrew"),
          onStatus: vi.fn((callback: (status: UpdateStatus) => void) => {
            callback(availableStatus);
            return vi.fn();
          }),
        },
      },
    });

    await act(async () => {
      await renderWithI18n(
        <UpdateDialog isOpen={true} onClose={vi.fn()} initialStatus={availableStatus} />,
        { language: "en" },
      );
    });

    expect(
      screen.getByRole("button", {
        name: "Open Releases",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Create Full Backup",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "This PromptHub build was installed via Homebrew. Please upgrade it with Homebrew instead of the in-app DMG updater.",
      ),
    ).toBeInTheDocument();
  });

  it("requires a current-version manual backup and acknowledgement before allowing install", async () => {
    installWindowMocks({
      electron: {
        updater: {
          check: vi.fn().mockResolvedValue({ success: true }),
          download: vi.fn().mockResolvedValue(undefined),
          install: vi.fn().mockResolvedValue({ success: true }),
          getVersion: vi.fn().mockResolvedValue("0.5.1"),
          getPlatform: vi.fn().mockResolvedValue("win32"),
          onStatus: vi.fn((callback: (status: UpdateStatus) => void) => {
            callback(downloadedStatus);
            return vi.fn();
          }),
        },
      },
    });

    await act(async () => {
      await renderWithI18n(
        <UpdateDialog isOpen={true} onClose={vi.fn()} initialStatus={downloadedStatus} />,
        { language: "en" },
      );
    });

    const installButton = await screen.findByRole("button", {
      name: "Install Now",
    });
    expect(installButton).toBeDisabled();
    expect(
      screen.getByText(
        "Confirm the backup acknowledgement before continuing with the upgrade.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A manual backup for version 0.5.1 is required before installation. PromptHub will also create an automatic local snapshot once installation starts.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByLabelText(
        "I have backed up the relevant data and understand the app will close during installation.",
      ),
    );

    await waitFor(() => {
      expect(installButton).toBeDisabled();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Full Backup",
      }),
    );

    await waitFor(() => {
      expect(runPreUpgradeBackupMock).toHaveBeenCalledTimes(1);
      expect(runPreUpgradeBackupMock).toHaveBeenCalledWith("0.5.1");
    });

    await waitFor(() => {
      expect(installButton).not.toBeDisabled();
    });

    fireEvent.click(installButton);

    await waitFor(() => {
      expect(window.electron.updater.install).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps a visible available state when a transient checking event arrives", async () => {
    let statusHandler: ((status: UpdateStatus) => void) | undefined;

    installWindowMocks({
      electron: {
        updater: {
          check: vi.fn().mockResolvedValue({ success: true }),
          getVersion: vi.fn().mockResolvedValue("0.5.1"),
          getPlatform: vi.fn().mockResolvedValue("win32"),
          onStatus: vi.fn((callback: (status: UpdateStatus) => void) => {
            statusHandler = callback;
            callback(availableStatus);
            return vi.fn();
          }),
        },
      },
    });

    await act(async () => {
      await renderWithI18n(
        <UpdateDialog isOpen={true} onClose={vi.fn()} initialStatus={availableStatus} />,
        { language: "en" },
      );
    });

    expect(
      screen.getByText("Update Available"),
    ).toBeInTheDocument();

    await act(async () => {
      statusHandler?.({ status: "checking" });
    });

    expect(
      screen.getByText("Update Available"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Checking for updates..."),
    ).not.toBeInTheDocument();
  });

  // Regression guard for the flickering loop reported in #117/#118.
  // The parent (App.tsx) used to push every status change into
  // `initialStatus` while the dialog was open. The dialog's effect
  // depended on `initialStatus`, so each push re-ran `updater.check`,
  // which produced another status, and so on — visually this appeared as
  // a rapidly flickering dialog where the download button could not be
  // clicked. After the fix, prop-level `initialStatus` changes must not
  // retrigger the background check.
  it("does not re-run updater.check when initialStatus changes while open", async () => {
    const checkMock = vi.fn().mockResolvedValue({ success: true });

    installWindowMocks({
      electron: {
        updater: {
          check: checkMock,
          getVersion: vi.fn().mockResolvedValue("0.5.1"),
          getPlatform: vi.fn().mockResolvedValue("win32"),
          onStatus: vi.fn(() => vi.fn()),
        },
      },
    });

    let renderResult: Awaited<ReturnType<typeof renderWithI18n>> | null = null;
    await act(async () => {
      renderResult = await renderWithI18n(
        <UpdateDialog
          isOpen={true}
          onClose={vi.fn()}
          initialStatus={{ status: "checking" }}
        />,
        { language: "en" },
      );
    });
    if (!renderResult) {
      throw new Error("expected UpdateDialog render result");
    }

    const { rerender } = renderResult;

    // First open triggers exactly one check.
    await waitFor(() => {
      expect(checkMock).toHaveBeenCalledTimes(1);
    });

    // Parent pushing new status values should NOT trigger additional checks.
    await act(async () => {
      rerender(
        <UpdateDialog
          isOpen={true}
          onClose={vi.fn()}
          initialStatus={availableStatus}
        />,
      );
    });
    await act(async () => {
      rerender(
        <UpdateDialog
          isOpen={true}
          onClose={vi.fn()}
          initialStatus={downloadedStatus}
        />,
      );
    });

    // Give any pending promises a chance to resolve.
    await waitFor(() => {
      expect(checkMock).toHaveBeenCalledTimes(1);
    });
  });
});
