import os from "os";
import path from "path";

import {
  getPlatformGlobalRuleTemplate,
  getPlatformRootTemplate,
  type SkillPlatform,
  type SkillPlatformOsKey,
} from "@prompthub/shared/constants/platforms";

function resolvePlatformPath(template: string): string {
  const home = os.homedir();
  return template
    .replace(/^~/, home)
    .replace(/%USERPROFILE%/gi, home)
    .replace(/%APPDATA%/gi, path.join(home, "AppData", "Roaming"));
}

function getPlatformOsKey(platform: NodeJS.Platform = process.platform): SkillPlatformOsKey {
  if (platform === "darwin" || platform === "win32") {
    return platform;
  }

  return "linux";
}

export function getDefaultPlatformRootDir(
  platform: SkillPlatform,
  targetPlatform: NodeJS.Platform = process.platform,
): string {
  return resolvePlatformPath(getPlatformRootTemplate(platform, getPlatformOsKey(targetPlatform)));
}

export function getDefaultPlatformGlobalRulePath(
  platform: SkillPlatform,
  targetPlatform: NodeJS.Platform = process.platform,
): string | null {
  const template = getPlatformGlobalRuleTemplate(platform, getPlatformOsKey(targetPlatform));
  return template ? resolvePlatformPath(template) : null;
}
