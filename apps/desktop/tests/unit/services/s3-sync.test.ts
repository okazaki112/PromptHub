import { beforeEach, describe, expect, it, vi } from "vitest";

import { installWindowMocks } from "../../helpers/window";
import { testConnection } from "../../../src/renderer/services/s3-sync";

describe("s3-sync", () => {
  beforeEach(() => {
    installWindowMocks({
      electron: {
        s3: {
          testConnection: vi.fn().mockResolvedValue({
            success: true,
            message: "Connection successful",
          }),
        },
      },
    });
  });

  it("delegates connection checks to the preload s3 bridge", async () => {
    const result = await testConnection({
      endpoint: "https://s3.example.com",
      region: "us-east-1",
      bucket: "prompthub-backups",
      accessKeyId: "access",
      secretAccessKey: "secret",
      backupPrefix: "prompthub",
    });

    expect(window.electron?.s3?.testConnection).toHaveBeenCalledWith({
      endpoint: "https://s3.example.com",
      region: "us-east-1",
      bucket: "prompthub-backups",
      accessKeyId: "access",
      secretAccessKey: "secret",
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe("Connection successful");
  });
});
