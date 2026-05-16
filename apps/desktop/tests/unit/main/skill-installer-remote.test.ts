/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("dns/promises", () => ({
  lookup: vi.fn(),
}));

import * as dns from "dns/promises";
import { resolvePublicAddress } from "../../../src/main/services/skill-installer-remote";

describe("skill-installer-remote", () => {
  it("allows trusted remote hosts when DNS is mapped to 198.18.x.x compatibility addresses", async () => {
    vi.mocked(dns.lookup).mockResolvedValueOnce([
      { address: "198.18.0.195", family: 4 },
    ]);

    await expect(resolvePublicAddress("raw.githubusercontent.com")).resolves.toEqual(
      { address: "198.18.0.195", family: 4 },
    );
  });

  it("allows trusted remote hosts when DNS is mapped to translated IPv6 compatibility addresses", async () => {
    vi.mocked(dns.lookup).mockResolvedValueOnce([
      { address: "::ffff:0:c612:c3", family: 6 },
    ]);

    await expect(resolvePublicAddress("raw.githubusercontent.com")).resolves.toEqual(
      { address: "::ffff:0:c612:c3", family: 6 },
    );
  });

  it("still blocks untrusted hosts that resolve to 198.18.x.x", async () => {
    vi.mocked(dns.lookup).mockResolvedValueOnce([
      { address: "198.18.0.42", family: 4 },
    ]);

    await expect(resolvePublicAddress("example.com")).rejects.toThrow(
      /Access to internal network addresses is not allowed/,
    );
  });
});

/**
 * Issue #108 regression: the GitHub PAT from settings must be attached only
 * when the target host is an official GitHub endpoint. This prevents leaking
 * the token to any third party via redirects or user-controlled URLs.
 */
describe("shouldAttachGithubAuth (issue #108)", () => {
  // Imported lazily so the dns mock above does not leak into this block.
  async function load() {
    const mod = await import(
      "../../../src/main/services/skill-installer-remote"
    );
    return mod.shouldAttachGithubAuth;
  }

  it.each(["api.github.com", "raw.githubusercontent.com"])(
    "attaches the token for trusted host %s",
    async (host) => {
      const shouldAttachGithubAuth = await load();
      expect(shouldAttachGithubAuth(host)).toBe(true);
    },
  );

  it.each([
    "api.github.com".toUpperCase(),
    "Api.GitHub.com",
    "RAW.githubusercontent.com",
  ])("is case-insensitive for trusted host %s", async (host) => {
    const shouldAttachGithubAuth = await load();
    expect(shouldAttachGithubAuth(host)).toBe(true);
  });

  it.each([
    "example.com",
    "codeload.github.com",
    "github.com", // the git endpoint, NOT the API — no token here
    "evilgithub.com",
    "api.github.com.evil.com",
    "raw.githubusercontent.com.attacker.net",
    "skills.sh",
  ])("never attaches the token for untrusted host %s", async (host) => {
    const shouldAttachGithubAuth = await load();
    expect(shouldAttachGithubAuth(host)).toBe(false);
  });

  it("returns false for empty or garbage hostnames", async () => {
    const shouldAttachGithubAuth = await load();
    expect(shouldAttachGithubAuth("")).toBe(false);
    expect(shouldAttachGithubAuth("   ")).toBe(false);
    expect(shouldAttachGithubAuth("http://api.github.com")).toBe(false);
  });
});
