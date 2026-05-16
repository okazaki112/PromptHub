/**
 * Internal utilities shared across skill-installer sub-modules.
 *
 * These are NOT part of the public API — only consumed by sibling modules
 * within the skill-installer package.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { getSkillsDir } from "../runtime-paths";

// ==================== Error helpers ====================

export function getErrorCode(error: unknown): string | undefined {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : undefined;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ==================== Path utilities ====================

export function isPathWithin(basePath: string, targetPath: string): boolean {
  const relative = path.relative(basePath, targetPath);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function normalizeExistingPath(
  absolutePath: string,
): Promise<string> {
  const resolvedPath = path.resolve(absolutePath);
  try {
    return await fs.realpath(resolvedPath);
  } catch {
    return resolvedPath;
  }
}

// ==================== skillsDir accessor ====================

export function getSkillsDirAccessor(): string {
  return getSkillsDir();
}

// ==================== Validation ====================

export function validateSkillName(skillName: string): void {
  if (!skillName || skillName.trim().length === 0) {
    throw new Error("Invalid skill name: must not be empty");
  }
  // Reject null bytes which can bypass path checks and cause silent truncation
  if (skillName.includes("\0")) {
    throw new Error("Invalid skill name: must not contain null bytes");
  }
  if (
    skillName.includes("..") ||
    skillName.includes("/") ||
    skillName.includes("\\")
  ) {
    throw new Error(
      `Invalid skill name: must not contain "..", "/" or "\\": ${skillName}`,
    );
  }
  // Reject absolute paths on Windows (e.g., C:\)
  if (/^[a-zA-Z]:/.test(skillName)) {
    throw new Error(
      `Invalid skill name: must not be an absolute path: ${skillName}`,
    );
  }
  // Final check: resolved path must be a direct child of skillsDir
  const skillsDir = getSkillsDirAccessor();
  const resolved = path.resolve(skillsDir, skillName);
  if (path.dirname(resolved) !== path.resolve(skillsDir)) {
    throw new Error(
      `Invalid skill name: resolved path escapes skills directory: ${skillName}`,
    );
  }
}

export function validateRelativePath(relativePath: string): void {
  // Reject null bytes which can bypass path checks and cause silent truncation
  if (relativePath.includes("\0")) {
    throw new Error("Invalid relative path: must not contain null bytes");
  }
  if (relativePath.includes("..")) {
    throw new Error(
      `Invalid relative path: must not contain "..": ${relativePath}`,
    );
  }
  if (relativePath.startsWith("/") || relativePath.startsWith("\\")) {
    throw new Error(
      `Invalid relative path: must not start with "/" or "\\": ${relativePath}`,
    );
  }
  // Reject absolute paths on Windows (e.g., C:\)
  if (/^[a-zA-Z]:/.test(relativePath)) {
    throw new Error(
      `Invalid relative path: must not be an absolute path: ${relativePath}`,
    );
  }
}

// ==================== File helpers ====================

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ==================== Repo path resolution ====================

export async function resolveRepoBasePath(
  absoluteBasePath: string,
  options?: { ensureExists?: boolean; allowOutsideSkillsDir?: boolean },
): Promise<{ resolvedBasePath: string; realBasePath: string }> {
  const skillsDir = getSkillsDirAccessor();
  const resolvedBasePath = path.resolve(absoluteBasePath);
  const resolvedSkillsDir = path.resolve(skillsDir);
  const realSkillsDir = await fs
    .realpath(resolvedSkillsDir)
    .catch(() => resolvedSkillsDir);
  // Also resolve the base path through realpath so symlinks on either side
  // don't cause a false-positive traversal detection.
  const realResolvedBasePath = await fs
    .realpath(resolvedBasePath)
    .catch(() => resolvedBasePath);

  if (
    !options?.allowOutsideSkillsDir &&
    !isPathWithin(resolvedSkillsDir, resolvedBasePath) &&
    !isPathWithin(realSkillsDir, resolvedBasePath) &&
    !isPathWithin(resolvedSkillsDir, realResolvedBasePath) &&
    !isPathWithin(realSkillsDir, realResolvedBasePath)
  ) {
    throw new Error(
      "Path traversal detected: base path is outside skills directory",
    );
  }

  if (options?.ensureExists) {
    await fs.mkdir(resolvedBasePath, { recursive: true });
  }

  const realBasePath = await fs
    .realpath(resolvedBasePath)
    .catch(() => resolvedBasePath);
  if (!options?.allowOutsideSkillsDir && !isPathWithin(realSkillsDir, realBasePath)) {
    throw new Error("Managed repo path resolves outside skills directory");
  }

  return { resolvedBasePath, realBasePath };
}

export async function resolveRepoTargetPath(
  absoluteBasePath: string,
  relativePath: string,
  options?: { ensureBaseExists?: boolean; allowOutsideSkillsDir?: boolean },
): Promise<{ fullPath: string; realBasePath: string }> {
  validateRelativePath(relativePath);
  const { resolvedBasePath, realBasePath } = await resolveRepoBasePath(
    absoluteBasePath,
    {
      ensureExists: options?.ensureBaseExists,
      allowOutsideSkillsDir: options?.allowOutsideSkillsDir,
    },
  );
  const fullPath = path.resolve(resolvedBasePath, relativePath);
  // Also check against the realpath of fullPath in case of symlinks.
  const realFullPath = await fs.realpath(fullPath).catch(() => fullPath);
  // When fullPath does not yet exist, realpath falls back to the unresolved
  // path which may use a symlinked prefix (e.g. /tmp → /private/tmp on macOS).
  // In that case, also construct an equivalent path from the already-resolved
  // realBasePath so the isPathWithin check succeeds for legitimate paths.
  const realBasedFullPath = path.resolve(realBasePath, relativePath);
  if (
    !isPathWithin(realBasePath, fullPath) &&
    !isPathWithin(realBasePath, realFullPath) &&
    !isPathWithin(realBasePath, realBasedFullPath)
  ) {
    throw new Error("Path traversal detected: target path escapes repo root");
  }
  return { fullPath, realBasePath };
}

// ==================== Initialization ====================

export async function initSkillsDir(): Promise<void> {
  const skillsDir = getSkillsDirAccessor();
  try {
    await fs.mkdir(skillsDir, { recursive: true });
  } catch (e) {
    throw new Error(
      `Failed to create skills directory "${skillsDir}": ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
