/**
 * Platform management for MCP skill installation (Claude, Cursor, etc.)
 * and SKILL.md multi-platform distribution.
 */
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import {
  SKILL_PLATFORMS,
  type SkillPlatform,
} from "@prompthub/shared/constants/platforms";
import {
  fileExists,
  getErrorCode,
  getSkillsDirAccessor,
  initSkillsDir,
  validateSkillName,
} from "./skill-installer-internal";
import { saveContentToLocalRepo } from "./skill-installer-repo";
import {
  getPlatformSkillsDir,
  validateMCPConfig,
} from "./skill-installer-utils";

// ==================== Config path resolution ====================

function getPlatformConfigPath(platform: "claude" | "cursor"): string {
  const homeDir = os.homedir();
  if (platform === "claude") {
    switch (process.platform) {
      case "darwin":
        return path.join(
          homeDir,
          "Library/Application Support/Claude/claude_desktop_config.json",
        );
      case "win32":
        return path.join(
          homeDir,
          "AppData/Roaming/Claude/claude_desktop_config.json",
        );
      default:
        return path.join(homeDir, ".config/claude/claude_desktop_config.json");
    }
  }
  // cursor uses the same path on all platforms
  return path.join(homeDir, ".cursor/mcp.json");
}

// ==================== Config file locking ====================

/**
 * Per-path mutex to prevent concurrent config file read-modify-write races.
 */
const configLocks = new Map<string, Promise<void>>();

async function withConfigLock<T>(
  configPath: string,
  fn: () => Promise<T>,
): Promise<T> {
  // Wait for any pending operation on this config file
  const pending = configLocks.get(configPath) ?? Promise.resolve();
  let release: () => void;
  const lock = new Promise<void>((resolve) => {
    release = resolve;
  });
  configLocks.set(configPath, lock);
  await pending;
  try {
    return await fn();
  } finally {
    release!();
    if (configLocks.get(configPath) === lock) {
      configLocks.delete(configPath);
    }
  }
}

// ==================== MCP platform install/uninstall ====================

export async function installToPlatform(
  platform: "claude" | "cursor",
  name: string,
  mcpConfig: unknown,
): Promise<void> {
  if (platform !== "claude" && platform !== "cursor") {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  // Runtime validation of MCP config structure before writing to platform config
  validateMCPConfig(mcpConfig, name);

  const configPath = getPlatformConfigPath(platform);

  return withConfigLock(configPath, async () => {
    if (!(await fileExists(configPath))) {
      // If file doesn't exist, create a basic one
      const dir = path.dirname(configPath);
      await fs.mkdir(dir, { recursive: true });
      const initialConfig = { mcpServers: {} };
      await fs.writeFile(configPath, JSON.stringify(initialConfig, null, 2));
    }

    try {
      const content = await fs.readFile(configPath, "utf-8");
      // Safe: JSON.parse returns `any`; narrowed to Record for property access
      const config = JSON.parse(content) as Record<string, unknown>;

      // Handle different key variations
      if (!config.mcpServers && !config.mcp_servers && !config.servers) {
        config.mcpServers = {};
      }

      const serversKey = config.mcpServers
        ? "mcpServers"
        : config.mcp_servers
          ? "mcp_servers"
          : "servers";

      // Merge config
      // mcpConfig is expected to be { servers: { name: config } }
      // Safe: mcpConfig is validated by validateMCPConfig before reaching here
      const configObj = mcpConfig as Record<string, unknown>;
      const sourceServers =
        configObj.servers && typeof configObj.servers === "object"
          ? // Safe: guarded by typeof check above
            (configObj.servers as Record<string, unknown>)
          : { [name]: mcpConfig };
      const sourceServerEntries = Object.entries(sourceServers);
      if (
        sourceServerEntries.length !== 1 ||
        sourceServerEntries[0][0] !== name
      ) {
        throw new Error(
          "MCP config must contain exactly one server entry matching the skill name",
        );
      }
      await fs.copyFile(configPath, `${configPath}.bak`);
      config[serversKey] = {
        // Safe: config[serversKey] is initialized above if missing
        ...(config[serversKey] as Record<string, unknown>),
        [name]: sourceServerEntries[0][1],
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      console.log(`Successfully installed skill ${name} to ${platform}`);
    } catch (error) {
      console.error(`Failed to install to ${platform}:`, error);
      throw error;
    }
  });
}

export async function uninstallFromPlatform(
  platform: "claude" | "cursor",
  name: string,
): Promise<void> {
  const configPath = getPlatformConfigPath(platform);

  return withConfigLock(configPath, async () => {
    if (!(await fileExists(configPath))) return;

    try {
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const serversKey = config.mcpServers
        ? "mcpServers"
        : config.mcp_servers
          ? "mcp_servers"
          : "servers";

      if (config[serversKey] && config[serversKey][name]) {
        delete config[serversKey][name];
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(`Successfully uninstalled skill ${name} from ${platform}`);
      }
    } catch (e) {
      console.error(`Failed to uninstall from ${platform}:`, e);
      throw e;
    }
  });
}

export async function getPlatformStatus(
  name: string,
): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = { claude: false, cursor: false };

  const check = async (platform: "claude" | "cursor"): Promise<void> => {
    const configPath = getPlatformConfigPath(platform);
    if (!(await fileExists(configPath))) return;
    try {
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);
      const servers =
        config.mcpServers || config.mcp_servers || config.servers || {};
      if (servers[name]) status[platform] = true;
    } catch (e) {
      console.error("Failed to read platform config:", e);
    }
  };

  await check("claude");
  await check("cursor");

  return status;
}

// ==================== SKILL.md multi-platform ====================

/**
 * Get list of supported platforms.
 */
export function getSupportedPlatforms(): SkillPlatform[] {
  return SKILL_PLATFORMS;
}

/**
 * Detect which AI tools are installed on the system.
 */
export async function detectInstalledPlatforms(): Promise<string[]> {
  const installed: string[] = [];

  for (const platform of SKILL_PLATFORMS) {
    const skillsDir = getPlatformSkillsDir(platform);
    // Check if the parent directory exists (e.g., ~/.claude means Claude Code is installed)
    const parentDir = path.dirname(skillsDir);

    if (await fileExists(parentDir)) {
      installed.push(platform.id);
    }
  }

  return installed;
}

/**
 * Install SKILL.md to a specific platform.
 *
 * Also ensures the canonical copy in the local repo exists.
 */
export async function installSkillMd(
  skillName: string,
  skillMdContent: string,
  platformId: string,
): Promise<void> {
  validateSkillName(skillName);
  const platform = SKILL_PLATFORMS.find((p) => p.id === platformId);
  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}`);
  }

  // Ensure the canonical copy exists in local repo
  await saveContentToLocalRepo(skillName, skillMdContent);

  const skillsDir = getPlatformSkillsDir(platform);
  const skillDir = path.join(skillsDir, skillName);

  try {
    // Create skill directory
    await fs.mkdir(skillDir, { recursive: true });

    // Write SKILL.md file
    await fs.writeFile(
      path.join(skillDir, "SKILL.md"),
      skillMdContent,
      "utf-8",
    );

    console.log(
      `Successfully installed SKILL.md for "${skillName}" to ${platform.name} at ${skillDir}`,
    );
  } catch (error) {
    console.error(`Failed to install SKILL.md to ${platform.name}:`, error);
    throw error;
  }
}

/**
 * Uninstall SKILL.md from a specific platform.
 */
export async function uninstallSkillMd(
  skillName: string,
  platformId: string,
): Promise<void> {
  validateSkillName(skillName);
  const platform = SKILL_PLATFORMS.find((p) => p.id === platformId);
  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}`);
  }

  const skillsDir = getPlatformSkillsDir(platform);
  const skillDir = path.join(skillsDir, skillName);

  try {
    // Check if skill directory exists
    if (await fileExists(skillDir)) {
      await fs.rm(skillDir, { recursive: true, force: true });
      console.log(
        `Successfully uninstalled SKILL.md for "${skillName}" from ${platform.name}`,
      );
    }
  } catch (error) {
    console.error(`Failed to uninstall SKILL.md from ${platform.name}:`, error);
    throw error;
  }
}

/**
 * Get SKILL.md installation status across all platforms
 */
export async function getSkillMdInstallStatus(
  skillName: string,
): Promise<Record<string, boolean>> {
  validateSkillName(skillName);
  const status: Record<string, boolean> = {};

  for (const platform of SKILL_PLATFORMS) {
    const skillsDir = getPlatformSkillsDir(platform);
    const skillMdPath = path.join(skillsDir, skillName, "SKILL.md");

    status[platform.id] = await fileExists(skillMdPath);
  }

  return status;
}

/**
 * Install SKILL.md to a platform via symlink (soft install)
 *
 * Creates a platform skill directory that symlinks only the canonical
 * `SKILL.md` file from PromptHub's managed repo. This preserves shared
 * updates without exposing PromptHub-internal sidecar directories such as
 * `.prompthub/` to external platform skill folders.
 */
export async function installSkillMdSymlink(
  skillName: string,
  skillMdContent: string,
  platformId: string,
): Promise<void> {
  const mainSkillsDir = getSkillsDirAccessor();
  validateSkillName(skillName);
  const platform = SKILL_PLATFORMS.find((p) => p.id === platformId);
  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}`);
  }

  await initSkillsDir();

  // 1. Write the canonical copy into PromptHub's own skills dir
  const canonicalDir = path.join(mainSkillsDir, skillName);
  await fs.mkdir(canonicalDir, { recursive: true });
  await fs.writeFile(
    path.join(canonicalDir, "SKILL.md"),
    skillMdContent,
    "utf-8",
  );
  const canonicalSkillMdPath = path.join(canonicalDir, "SKILL.md");

  // 2. Create a platform skill dir and symlink only SKILL.md into it
  const platformSkillsDir = getPlatformSkillsDir(platform);
  const platformSkillDir = path.join(platformSkillsDir, skillName);
  const platformSkillMdPath = path.join(platformSkillDir, "SKILL.md");
  const fallbackInstall = async (reason: string): Promise<void> => {
    console.warn(
      `Symlink install unsupported for "${skillName}" on ${platform.name}; falling back to copy install. Reason: ${reason}`,
    );
    await installSkillMd(skillName, skillMdContent, platformId);
  };

  try {
    // Ensure parent exists
    await fs.mkdir(platformSkillsDir, { recursive: true });

    // Remove existing target if present (file, dir, or broken symlink)
    try {
      const stat = await fs.lstat(platformSkillDir);
      if (stat.isSymbolicLink() || stat.isDirectory() || stat.isFile()) {
        await fs.rm(platformSkillDir, { recursive: true, force: true });
      }
    } catch (error: unknown) {
      if (getErrorCode(error) !== "ENOENT") throw error;
    }

    // Create directory symlink
    await fs.mkdir(platformSkillDir, { recursive: true });
    await fs.symlink(canonicalSkillMdPath, platformSkillMdPath, "file");
    console.log(
      `Symlinked "${skillName}" → ${platform.name}: ${canonicalSkillMdPath} → ${platformSkillMdPath}`,
    );
  } catch (error) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message : String(error);
    // Windows needs either admin or Developer Mode to call CreateSymbolicLink.
    // macOS/Linux commonly fail with EACCES on read-only file systems. In all
    // these cases the copy fallback is the right behavior — the user still
    // gets the skill installed. We log a structured warning so that a
    // partial-failure toast (see renderer #93 handling) can tell the user
    // that a copy was used instead of a symlink.
    if (
      code === "EPERM" ||
      code === "EACCES" ||
      code === "ENOTSUP" ||
      code === "UNKNOWN"
    ) {
      await fallbackInstall(`${code}: ${message}`);
      return;
    }

    console.error(
      `Failed to create symlink for "${skillName}" to ${platform.name}:`,
      error,
    );
    // Rethrow with a more actionable message so the renderer can show a
    // localizable error. The raw node error message is preserved in .cause.
    const formatted = new Error(
      `Symlink install failed for "${skillName}" on ${platform.name}: ${message}${
        code ? ` (${code})` : ""
      }`,
    );
    if (error instanceof Error) {
      (formatted as Error & { cause?: unknown }).cause = error;
    }
    throw formatted;
  }
}
