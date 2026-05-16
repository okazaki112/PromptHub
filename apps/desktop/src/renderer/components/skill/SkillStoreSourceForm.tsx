import type { TFunction } from "i18next";
import type { SkillStoreSource } from "@prompthub/shared/types";

interface SkillStoreSourceFormProps {
  handleAddSource: () => void;
  setSourceName: (value: string) => void;
  setSourceType: (
    value: Extract<
      SkillStoreSource["type"],
      "marketplace-json" | "git-repo" | "local-dir"
    >,
  ) => void;
  setSourceUrl: (value: string) => void;
  sourceName: string;
  sourceType: Extract<
    SkillStoreSource["type"],
    "marketplace-json" | "git-repo" | "local-dir"
  >;
  sourceUrl: string;
  t: TFunction;
  typeOptions: Array<{
    value: Extract<
      SkillStoreSource["type"],
      "marketplace-json" | "git-repo" | "local-dir"
    >;
    icon: React.ReactNode;
  }>;
}

export function SkillStoreSourceForm({
  handleAddSource,
  setSourceName,
  setSourceType,
  setSourceUrl,
  sourceName,
  sourceType,
  sourceUrl,
  t,
  typeOptions,
}: SkillStoreSourceFormProps) {
  return (
    <div className="space-y-4 app-wallpaper-surface border border-border rounded-2xl p-4">
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("skill.storeSourceType", "Store Type")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {typeOptions.map((option) => {
            const active = sourceType === option.value;
            const label =
              option.value === "marketplace-json"
                ? t("skill.sourceTypeMarketplace", "Marketplace JSON")
                : option.value === "git-repo"
                  ? t("skill.sourceTypeGit", "Git Repository")
                  : t("skill.sourceTypeLocal", "Local Directory");
            const hint =
              option.value === "marketplace-json"
                ? t(
                    "skill.sourceTypeMarketplaceHint",
                    "Best for a direct marketplace.json URL. PromptHub will read the index and load store entries from it.",
                  )
                : option.value === "git-repo"
                  ? t(
                      "skill.sourceTypeGitHint",
                      "Best for a GitHub or Git repository URL. PromptHub will detect SKILL.md folders or a store index inside it.",
                    )
                  : t(
                      "skill.sourceTypeLocalHint",
                      "Best for a local folder path. PromptHub will scan it for skill folders.",
                    );

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSourceType(option.value)}
                className={`text-left rounded-xl border px-4 py-3 transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-foreground shadow-[0_0_0_1px_rgba(96,165,250,0.2)]"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className={
                      active ? "text-primary" : "text-muted-foreground"
                    }
                  >
                    {option.icon}
                  </span>
                  {label}
                </div>
                <div className="mt-1 text-xs leading-5">{hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.35fr_auto] gap-2">
        <input
          type="text"
          value={sourceName}
          onChange={(event) => setSourceName(event.target.value)}
          placeholder={t("skill.storeNamePlaceholder", "Store name")}
          className="px-3 py-2 text-sm bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
        <input
          type="text"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder={
            sourceType === "local-dir"
              ? t("skill.storePathPlaceholder", "Local directory path")
              : t("skill.storeUrlPlaceholder", "Store URL / manifest URL")
          }
          className="px-3 py-2 text-sm bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
        <button
          onClick={handleAddSource}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
        >
          {t("common.add", "Add")}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-6">
        <div className="font-medium text-foreground mb-1">
          {t("skill.storeExamples", "Examples")}
        </div>
        {sourceType === "marketplace-json" && (
          <>
            <div>
              {t("skill.storeExampleMarketplace", "Marketplace JSON example")}
            </div>
            <div className="mt-1 font-mono break-all text-[11px]">
              https://raw.githubusercontent.com/docker/claude-code-plugin-manager/main/marketplace.json
            </div>
          </>
        )}
        {sourceType === "git-repo" && (
          <>
            <div>{t("skill.storeExampleGit", "Git repository example")}</div>
            <div className="mt-1 font-mono break-all text-[11px]">
              https://github.com/anthropics/skills
            </div>
            <div className="mt-1 font-mono break-all text-[11px]">
              ~/Projects/my-skill-repo
            </div>
          </>
        )}
        {sourceType === "local-dir" && (
          <>
            <div>{t("skill.storeExampleLocal", "Local directory example")}</div>
            <div className="mt-1 font-mono break-all text-[11px]">
              ~/Documents/my-skills
            </div>
          </>
        )}
      </div>
    </div>
  );
}
