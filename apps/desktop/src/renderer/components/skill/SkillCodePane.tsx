import { CheckIcon, CopyIcon, ChevronRightIcon } from "lucide-react";
import type { TFunction } from "i18next";
import type { Skill } from "@prompthub/shared/types";
import { getProtocolDisplayLabel, getSkillSourceMeta } from "./detail-utils";

interface SkillCodePaneProps {
  copyStatus: Record<string, boolean>;
  handleCopy: (text: string, key: string) => void;
  selectedSkill: Skill;
  skillContent: string;
  t: TFunction;
}

export function SkillCodePane({
  copyStatus,
  handleCopy,
  selectedSkill,
  skillContent,
  t,
}: SkillCodePaneProps) {
  const sourceMeta = getSkillSourceMeta(selectedSkill, t);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t("skill.metadata")}
        </h3>
        <div className="rounded-2xl border border-border app-wallpaper-surface p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">{t("skill.id")}</div>
              <div className="mt-1 truncate font-mono text-xs">{selectedSkill.id}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">{t("skill.protocol")}</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                <ChevronRightIcon className="w-4 h-4" />
                {getProtocolDisplayLabel(selectedSkill.protocol_type)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">{t("skill.createdAt")}</div>
              <div className="mt-1 text-xs">{new Date(selectedSkill.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">{t("skill.updatedAt")}</div>
              <div className="mt-1 text-xs">{new Date(selectedSkill.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </section>

      {sourceMeta ? (
        <a
          href={sourceMeta.kind === "local" ? undefined : sourceMeta.value}
          onClick={(event) => {
            if (sourceMeta.kind === "local") {
              event.preventDefault();
              window.electron?.openPath?.(sourceMeta.value);
            }
          }}
          target={sourceMeta.kind === "local" ? undefined : "_blank"}
          rel={sourceMeta.kind === "local" ? undefined : "noreferrer"}
          className="grid grid-cols-[auto,minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border app-wallpaper-surface px-4 py-3 text-left transition-colors hover:bg-accent"
          title={sourceMeta.displayValue}
        >
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("skill.source", "Source")}
          </div>
          <div className="min-w-0 grid grid-cols-[auto,minmax(0,1fr)] items-center gap-3">
            <div className="truncate text-sm font-medium">{sourceMeta.sourceLabel}</div>
            <div className="whitespace-normal break-words text-xs text-muted-foreground">
              {sourceMeta.displayValue}
            </div>
          </div>
        </a>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {t("skill.rawContent", "SKILL.md Content")}
          </h3>
          {skillContent.trim() && (
            <button
              onClick={() => handleCopy(skillContent, "raw")}
              className="p-1 px-3 bg-accent/50 hover:bg-accent rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              {copyStatus.raw ? (
                <CheckIcon className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5" />
              )}
              {copyStatus.raw ? t("skill.copied") : t("skill.copyMd")}
            </button>
          )}
        </div>
        <div className="app-wallpaper-panel border border-border rounded-2xl overflow-hidden">
          {skillContent.trim() ? (
            <pre className="p-5 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-words max-h-[68vh] overflow-y-auto">
              {skillContent}
            </pre>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t("skill.noContent", "No content available")}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
