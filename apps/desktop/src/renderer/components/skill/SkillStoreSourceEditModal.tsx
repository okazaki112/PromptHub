import { useEffect, useState } from "react";
import { DatabaseIcon, FolderIcon, GlobeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { SkillStoreSource } from "@prompthub/shared/types";

type EditableSourceType = Extract<
  SkillStoreSource["type"],
  "marketplace-json" | "git-repo" | "local-dir"
>;

const TYPE_OPTIONS: Array<{
  value: EditableSourceType;
  icon: React.ReactNode;
}> = [
  { value: "marketplace-json", icon: <DatabaseIcon className="w-4 h-4" /> },
  { value: "git-repo", icon: <GlobeIcon className="w-4 h-4" /> },
  { value: "local-dir", icon: <FolderIcon className="w-4 h-4" /> },
];

interface SkillStoreSourceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (sourceId: string) => void;
  onSave: (payload: {
    id: string;
    name: string;
    type: EditableSourceType;
    url: string;
  }) => void;
  onToggleEnabled: (sourceId: string) => void;
  onRefresh: (sourceId: string) => void;
  refreshingSourceId?: string | null;
  source: SkillStoreSource | null;
}

export function SkillStoreSourceEditModal({
  isOpen,
  onClose,
  onDelete,
  onSave,
  onToggleEnabled,
  onRefresh,
  refreshingSourceId,
  source,
}: SkillStoreSourceEditModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [type, setType] = useState<EditableSourceType>("marketplace-json");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!isOpen || !source) {
      return;
    }

    setName(source.name);
    setType(source.type as EditableSourceType);
    setUrl(source.url);
  }, [isOpen, source]);

  if (!source) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={t("common.edit", "Edit")}
      subtitle={t(
        "skill.customStoresHint",
        "Add your own store endpoints here. A later step can connect remote manifests or registries.",
      )}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {TYPE_OPTIONS.map((option) => {
            const active = type === option.value;
            const label =
              option.value === "marketplace-json"
                ? t("skill.sourceTypeMarketplace", "Marketplace JSON")
                : option.value === "git-repo"
                  ? t("skill.sourceTypeGit", "Git Repository")
                  : t("skill.sourceTypeLocal", "Local Directory");

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-foreground shadow-[0_0_0_1px_rgba(96,165,250,0.2)]"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className={active ? "text-primary" : "text-muted-foreground"}>
                    {option.icon}
                  </span>
                  {label}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("skill.storeNamePlaceholder", "Store name")}
            className="w-full rounded-lg border border-border bg-accent/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          />
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={
              type === "local-dir"
                ? t("skill.storePathPlaceholder", "Local directory path")
                : t("skill.storeUrlPlaceholder", "Store URL / manifest URL")
            }
            className="w-full rounded-lg border border-border bg-accent/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => onToggleEnabled(source.id)}
            >
              {source.enabled
                ? t("common.disable", "Disable")
                : t("common.enable", "Enable")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => onRefresh(source.id)}
            >
              <DatabaseIcon
                className={`w-4 h-4 ${refreshingSourceId === source.id ? "animate-spin" : ""}`}
              />
              {t("common.refresh", "Refresh")}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => onDelete(source.id)}
            >
              {t("common.delete", "Delete")}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => onSave({ id: source.id, name, type, url })}
          >
            {t("common.save", "Save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
