import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(websiteRoot, "..");

const rootPackagePath = path.join(repoRoot, "package.json");
const rootChangelogPath = path.join(repoRoot, "CHANGELOG.md");
const generatedReleasePath = path.join(
  websiteRoot,
  "src/generated/release.ts",
);
const websiteChangelogPath = path.join(
  websiteRoot,
  "src/content/docs/changelog.md",
);
const zhIntroPath = path.join(websiteRoot, "src/content/docs/introduction.md");
const enIntroPath = path.join(
  websiteRoot,
  "src/content/docs/en/introduction.md",
);

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
const changelog = fs.readFileSync(rootChangelogPath, "utf8");
const version = rootPackage.version;
const releaseTag = `v${version}`;
const releaseDownloadBase = version.includes("-")
  ? `https://github.com/legeling/PromptHub/releases/download/${releaseTag}`
  : "https://github.com/legeling/PromptHub/releases/latest/download";

const latestHeaderMatch = changelog.match(
  /^## \[(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)\] - (\d{4}-\d{2}-\d{2})/m,
);
const releaseDate = latestHeaderMatch?.[2] ?? "";

const generatedReleaseSource = `export const RELEASE_VERSION = "${version}";
export const RELEASE_TAG = "${releaseTag}";
export const RELEASE_DATE = "${releaseDate}";

export const HERO_VERSION_BADGE = {
  zh: "${releaseTag} 版已发布",
  en: "${releaseTag} Released",
} as const;

export const RELEASE_DOWNLOAD_URLS = {
  macArm64:
    "${releaseDownloadBase}/PromptHub-${version}-arm64.dmg",
  macX64:
    "${releaseDownloadBase}/PromptHub-${version}-x64.dmg",
  windowsX64:
    "${releaseDownloadBase}/PromptHub-Setup-${version}-x64.exe",
  windowsArm64:
    "${releaseDownloadBase}/PromptHub-Setup-${version}-arm64.exe",
  linuxAppImage:
    "${releaseDownloadBase}/PromptHub-${version}-x64.AppImage",
  linuxDeb:
    "${releaseDownloadBase}/prompthub_${version}_amd64.deb",
} as const;
`;

fs.mkdirSync(path.dirname(generatedReleasePath), { recursive: true });
fs.writeFileSync(generatedReleasePath, generatedReleaseSource);
fs.writeFileSync(websiteChangelogPath, changelog);

const zhIntro = fs
  .readFileSync(zhIntroPath, "utf8")
  .replace(
    /### 🧩 Skill 技能管理（v\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?）/,
    `### 🧩 Skill 技能管理（${releaseTag}）`,
  );
fs.writeFileSync(zhIntroPath, zhIntro);

const enIntro = fs
  .readFileSync(enIntroPath, "utf8")
  .replace(
    /### 🧩 Skill Management \(v\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?\)/,
    `### 🧩 Skill Management (${releaseTag})`,
  );
fs.writeFileSync(enIntroPath, enIntro);

console.log(
  `[website] synced release metadata: ${releaseTag}${releaseDate ? ` (${releaseDate})` : ""}`,
);
