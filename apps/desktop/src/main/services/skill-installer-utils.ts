import { spawn } from "child_process";
import * as os from "os";
import * as path from "path";
import { initDatabase } from "../database";
import type { MCPServerConfig } from "@prompthub/shared/types/skill";
import {
  getPlatformById,
  getPlatformGlobalRuleTemplate,
  getPlatformSkillsTemplate,
  normalizeLegacySkillPathToRootTemplate,
  type SkillPlatform,
} from "@prompthub/shared/constants/platforms";
import type { Settings } from "@prompthub/shared/types";

export function validateMCPServerConfig(
  config: unknown,
  serverName: string,
): asserts config is MCPServerConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error(
      `Invalid MCP server config for "${serverName}": expected an object`,
    );
  }
  const candidate = config as Record<string, unknown>;
  if (typeof candidate.command !== "string" || !candidate.command.trim()) {
    throw new Error(
      `Invalid MCP server config for "${serverName}": "command" must be a non-empty string`,
    );
  }
  if (candidate.args !== undefined) {
    if (
      !Array.isArray(candidate.args) ||
      !candidate.args.every((value) => typeof value === "string")
    ) {
      throw new Error(
        `Invalid MCP server config for "${serverName}": "args" must be a string array`,
      );
    }
  }
  if (candidate.env !== undefined) {
    if (
      !candidate.env ||
      typeof candidate.env !== "object" ||
      Array.isArray(candidate.env)
    ) {
      throw new Error(
        `Invalid MCP server config for "${serverName}": "env" must be an object`,
      );
    }
    for (const [key, value] of Object.entries(
      candidate.env as Record<string, unknown>,
    )) {
      if (typeof value !== "string") {
        throw new Error(
          `Invalid MCP server config for "${serverName}": env["${key}"] must be a string`,
        );
      }
    }
  }
}

export function validateMCPConfig(config: unknown, name: string): void {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error(
      `Invalid MCP config for "${name}": expected an object, got ${Array.isArray(config) ? "array" : typeof config}`,
    );
  }

  const candidate = config as Record<string, unknown>;
  if (candidate.servers !== undefined) {
    if (
      !candidate.servers ||
      typeof candidate.servers !== "object" ||
      Array.isArray(candidate.servers)
    ) {
      throw new Error(
        `Invalid MCP config for "${name}": "servers" must be an object`,
      );
    }
    for (const [serverName, serverConfig] of Object.entries(
      candidate.servers,
    )) {
      validateMCPServerConfig(serverConfig, serverName);
    }
    return;
  }

  validateMCPServerConfig(config, name);
}

const GIT_CLONE_TIMEOUT_MS = 60_000; // 60 seconds

export function gitClone(url: string, destDir: string): Promise<void> {
  if (!url.trim()) {
    throw new Error("Git clone URL cannot be empty");
  }
  if (url.startsWith("-")) {
    throw new Error("Git clone URL cannot start with '-'");
  }

  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTPS Git clone URLs are allowed");
  }

  return new Promise((resolve, reject) => {
    const proc = spawn("git", ["clone", "--depth", "1", "--", url, destDir], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill("SIGKILL");
        reject(
          new Error(
            `Git clone timed out after ${GIT_CLONE_TIMEOUT_MS / 1000}s for URL: ${url}`,
          ),
        );
      }
    }, GIT_CLONE_TIMEOUT_MS);

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Git clone failed with code ${code}: ${stderr}`));
      }
    });

    proc.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`Git clone error: ${error.message}`));
    });
  });
}

export function resolvePlatformPath(template: string): string {
  const home = os.homedir();
  return template
    .replace(/^~/, home)
    .replace(/%USERPROFILE%/gi, home)
    .replace(/%APPDATA%/gi, path.join(home, "AppData", "Roaming"));
}

let _customRootPathsCache: Record<string, string> | null = null;
let _customRootPathsCacheTs = 0;
const CUSTOM_PATHS_CACHE_TTL = 5000; // 5 seconds

function readPlatformRootPathsFromSettings(): Record<string, string> {
  const now = Date.now();
  if (
    _customRootPathsCache &&
    now - _customRootPathsCacheTs < CUSTOM_PATHS_CACHE_TTL
  ) {
    return _customRootPathsCache;
  }
  try {
    const db = initDatabase();
    if (!db || typeof db.prepare !== "function") {
      _customRootPathsCache = {};
      _customRootPathsCacheTs = now;
      return _customRootPathsCache;
    }
    const stmt = db.prepare("SELECT value FROM settings WHERE key = ?");
    const rootRow = stmt.get("customPlatformRootPaths") as
      | { value: string }
      | undefined;
    const legacyRow = stmt.get("customSkillPlatformPaths") as
      | { value: string }
      | undefined;

    const parseRecord = (
      rawValue: string | undefined,
    ): Record<string, string> | null => {
      if (!rawValue) {
        return null;
      }

      const parsed = JSON.parse(rawValue) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }

      return Object.entries(parsed).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          if (typeof value === "string") {
            acc[key] = value;
          }
          return acc;
        },
        {},
      );
    };

    const parsedRootPaths = parseRecord(rootRow?.value);
    if (parsedRootPaths) {
      _customRootPathsCache = parsedRootPaths;
      _customRootPathsCacheTs = now;
      return _customRootPathsCache;
    }

    const parsedLegacyPaths = parseRecord(legacyRow?.value);
    if (!parsedLegacyPaths) {
      _customRootPathsCache = {};
      _customRootPathsCacheTs = now;
      return _customRootPathsCache;
    }

    _customRootPathsCache = Object.fromEntries(
      Object.entries(parsedLegacyPaths).map(([platformId, value]) => {
        const platform = getPlatformById(platformId);
        if (!platform) {
          return [platformId, value];
        }
        return [platformId, migrateLegacySkillPathToRootPath(platform, value)];
      }),
    );
    _customRootPathsCacheTs = now;
    return _customRootPathsCache;
  } catch (error) {
    console.warn("Failed to read custom platform root paths:", error);
    _customRootPathsCache = {};
    _customRootPathsCacheTs = now;
    return _customRootPathsCache;
  }
}

/**
 * Invalidate the cached custom platform paths so the next call reads from DB.
 */
export function invalidateCustomPathsCache(): void {
  _customRootPathsCache = null;
  _customRootPathsCacheTs = 0;
}

export function getPlatformRootDir(
  platform: SkillPlatform,
  overrides?: Record<string, string>,
): string {
  const overridePath =
    overrides?.[platform.id] ?? readPlatformRootPathsFromSettings()[platform.id];

  if (typeof overridePath === "string" && overridePath.trim()) {
    return resolvePlatformPath(overridePath.trim());
  }

  const osKey = process.platform as "darwin" | "win32" | "linux";
  const template = platform.rootDir[osKey] || platform.rootDir.linux;
  return resolvePlatformPath(template);
}

export function getPlatformSkillsDir(
  platform: SkillPlatform,
  overrides?: Record<string, string>,
): string {
  const osKey = process.platform as "darwin" | "win32" | "linux";
  const rootDir = getPlatformRootDir(platform, overrides);
  const template = getPlatformSkillsTemplate(platform, osKey);
  const defaultRootDir = resolvePlatformPath(platform.rootDir[osKey] || platform.rootDir.linux);
  const normalizedDefaultSkillsDir = resolvePlatformPath(template);

  if (rootDir === defaultRootDir) {
    return normalizedDefaultSkillsDir;
  }

  return path.join(rootDir, ...platform.skillsRelativePath.split(/[\\/]+/).filter(Boolean));
}

export function getPlatformGlobalRulePath(
  platform: SkillPlatform,
  overrides?: Record<string, string>,
): string | null {
  if (!platform.globalRuleFile) {
    return null;
  }

  const osKey = process.platform as "darwin" | "win32" | "linux";
  const rootDir = getPlatformRootDir(platform, overrides);
  const template = getPlatformGlobalRuleTemplate(platform, osKey);
  const defaultRootDir = resolvePlatformPath(platform.rootDir[osKey] || platform.rootDir.linux);

  if (!template) {
    return null;
  }

  if (rootDir === defaultRootDir) {
    return resolvePlatformPath(template);
  }

  return path.join(rootDir, ...platform.globalRuleFile.split(/[\\/]+/).filter(Boolean));
}

export function migrateLegacySkillPathToRootPath(
  platform: SkillPlatform,
  legacySkillPath: string,
): string {
  return resolvePlatformPath(
    normalizeLegacySkillPathToRootTemplate(platform, legacySkillPath),
  );
}
