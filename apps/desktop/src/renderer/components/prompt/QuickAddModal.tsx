import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  SparklesIcon,
  XIcon,
  Loader2Icon,
  Wand2Icon,
} from "lucide-react";
import { useSettingsStore } from "../../stores/settings.store";
import { useFolderStore } from "../../stores/folder.store";
import { usePromptStore } from "../../stores/prompt.store";
import { chatCompletion } from "../../services/ai";
import { renderFolderIcon } from "../layout/folderIconHelper";
import { Select } from "../ui/Select";
import { UnsavedChangesDialog } from "../ui/UnsavedChangesDialog";
import { useToast } from "../ui/Toast";
import {
  buildQuickAddAnalysisPrompt,
  buildQuickAddGeneratePrompt,
  getQuickAddFallbackTitle,
  parseQuickAddAnalysisResult,
  parseQuickAddGeneratedDraft,
  type QuickAddMode,
  resolveQuickAddAnalysisConfig,
} from "./quick-add-utils";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    userPrompt: string;
    systemPrompt?: string;
    description?: string;
    folderId?: string;
    promptType?: "text" | "image";
    tags?: string[];
  }) => Promise<any>;
  defaultPromptType?: "text" | "image";
  initialMode?: QuickAddMode;
}

export function QuickAddModal({
  isOpen,
  onClose,
  onCreate,
  defaultPromptType,
  initialMode = "analyze",
}: QuickAddModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const folders = useFolderStore((state) => state.folders);
  const aiModels = useSettingsStore((state) => state.aiModels);
  const scenarioModelDefaults = useSettingsStore(
    (state) => state.scenarioModelDefaults,
  );
  const aiProvider = useSettingsStore((state) => state.aiProvider);
  const aiApiProtocol = useSettingsStore((state) => state.aiApiProtocol);
  const aiApiKey = useSettingsStore((state) => state.aiApiKey);
  const aiApiUrl = useSettingsStore((state) => state.aiApiUrl);
  const aiModel = useSettingsStore((state) => state.aiModel);
  const prompts = usePromptStore((state) => state.prompts);

  const [promptText, setPromptText] = useState("");
  const [mode, setMode] = useState<QuickAddMode>("analyze");
  const [selectedPromptType, setSelectedPromptType] = useState<"text" | "image">(
    defaultPromptType || "text",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined,
  );
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const analysisConfig = useMemo(
    () =>
      resolveQuickAddAnalysisConfig({
        aiModels,
        scenarioModelDefaults,
        aiProvider,
        aiApiProtocol,
        aiApiKey,
        aiApiUrl,
        aiModel,
      }),
    [
      aiApiKey,
      aiApiProtocol,
      aiApiUrl,
      aiModel,
      aiModels,
      aiProvider,
      scenarioModelDefaults,
    ],
  );

  // Check unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return promptText.trim() !== "";
  }, [promptText]);

  // Handle close request with guard
  const handleCloseRequest = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPromptText("");
      setMode(initialMode);
      setSelectedPromptType(defaultPromptType || "text");
      setSelectedFolderId(undefined);
      setIsSubmitting(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [defaultPromptType, initialMode, isOpen]);

  // Handle create
  const handleCreate = async () => {
    if (!promptText.trim() || isSubmitting) return;

    if (!analysisConfig) {
      showToast(t("quickAdd.noAiConfigDesc"), "error");
      return;
    }

    setIsSubmitting(true);

    const folderNames = folders.map((f) => f.name).join(", ");
    const existingTags = [...new Set(prompts.flatMap((p) => p.tags || []))].sort();
    const tagsString = existingTags.length > 0 ? existingTags.join(", ") : "无现有标签";

    const resolveMatchedFolderId = (suggestedFolder?: string | null) => {
      if (selectedFolderId) {
        return selectedFolderId;
      }

      if (!suggestedFolder) {
        return undefined;
      }

      const matchedFolder = folders.find(
        (folder) =>
          folder.name.toLowerCase().includes(suggestedFolder.toLowerCase()) ||
          suggestedFolder.toLowerCase().includes(folder.name.toLowerCase()),
      );

      return matchedFolder?.id;
    };

    if (mode === "generate") {
      try {
        const generationPrompt = buildQuickAddGeneratePrompt(
          promptText,
          { folderNames, tagsString },
          selectedPromptType,
        );

        const aiResult = await chatCompletion(
          analysisConfig,
          [{ role: "user", content: generationPrompt }],
          { temperature: 0.6 },
        );

        const generatedDraft = parseQuickAddGeneratedDraft(
          aiResult.content,
          selectedPromptType,
          t("prompt.newPrompt"),
        );

        if (!generatedDraft) {
          showToast(t("quickAdd.parseError"), "error");
          setIsSubmitting(false);
          return;
        }

        const createdPrompt = await onCreate({
          title: generatedDraft.title,
          userPrompt: generatedDraft.userPrompt,
          systemPrompt: generatedDraft.systemPrompt,
          description: generatedDraft.description,
          folderId: resolveMatchedFolderId(generatedDraft.suggestedFolder),
          promptType: generatedDraft.promptType,
          tags: generatedDraft.tags,
        });

        if (createdPrompt) {
          onClose();
        }
      } catch (err) {
        console.error("AI prompt generation failed:", err);
        showToast(t("quickAdd.analysisFailed"), "error");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    // Create prompt immediately. Only use the "analyzing" placeholder when
    // we actually have a usable chat model for background analysis.
    const createdPrompt = await onCreate({
      title: t("quickAdd.analyzing") || "正在分析...",
      userPrompt: promptText,
      folderId: selectedFolderId,
      promptType: selectedPromptType,
    });

    if (!createdPrompt) {
      setIsSubmitting(false);
      return;
    }

    onClose();

    // Background AI analysis
    try {
      const analysisPrompt = buildQuickAddAnalysisPrompt(promptText, {
        folderNames,
        tagsString,
      });
      const fallbackTitle = getQuickAddFallbackTitle(
        promptText,
        t("prompt.newPrompt"),
      );

      const aiResult = await chatCompletion(
        analysisConfig,
        [{ role: "user", content: analysisPrompt }],
        { temperature: 0.3 },
      );

      const parsedResult = parseQuickAddAnalysisResult(aiResult.content);

      if (parsedResult) {
        const { usePromptStore } = await import("../../stores/prompt.store");
        await usePromptStore.getState().updatePrompt(createdPrompt.id, {
          title: parsedResult.title || createdPrompt.title,
          systemPrompt: parsedResult.systemPrompt,
          description: parsedResult.description,
          folderId: resolveMatchedFolderId(parsedResult.suggestedFolder),
          tags: parsedResult.tags,
        });
      } else {
        const { usePromptStore } = await import("../../stores/prompt.store");
        await usePromptStore.getState().updatePrompt(createdPrompt.id, {
          title: fallbackTitle,
        });
      }
    } catch (err) {
      console.error("Background AI analysis failed:", err);
      // Fallback title if analysis fails
      const { usePromptStore } = await import("../../stores/prompt.store");
      await usePromptStore.getState().updatePrompt(createdPrompt.id, {
        title: getQuickAddFallbackTitle(promptText, t("prompt.newPrompt")),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCloseRequest}
      />

      <div className="relative w-full max-w-2xl max-h-[min(760px,calc(100vh-32px))] mx-4 app-wallpaper-panel-strong rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {t("quickAdd.title") || "快速添加 Prompt"}
            </h2>
          </div>
          <button
            onClick={handleCloseRequest}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 p-1 w-fit">
            <button
              type="button"
              onClick={() => setMode("analyze")}
              aria-pressed={mode === "analyze"}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "analyze"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("quickAdd.modeAnalyze") || "分析已有内容"}
            </button>
            <button
              type="button"
              onClick={() => setMode("generate")}
              aria-pressed={mode === "generate"}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "generate"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("quickAdd.modeGenerate") || "AI 生成 Prompt"}
            </button>
          </div>

          <div className="space-y-2.5">
            <label className="text-sm font-medium text-muted-foreground">
              {mode === "generate"
                ? t("quickAdd.generatePromptRequest") || "描述你想要的 Prompt"
                : t("quickAdd.pastePrompt") || "粘贴你的 Prompt"}
              <span className="ml-1 text-destructive">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              aria-label={
                mode === "generate"
                  ? t("quickAdd.generatePromptRequest") || "描述你想要的 Prompt"
                  : t("quickAdd.pastePrompt") || "粘贴你的 Prompt"
              }
              placeholder={
                mode === "generate"
                  ? t("quickAdd.generatePlaceholder") ||
                    "例如：帮我生成一个用于写小红书标题的 Prompt，语气年轻、有网感，输出 10 个备选标题。"
                  : t("quickAdd.placeholder") || "在这里粘贴你的 Prompt 内容..."
              }
              className="w-full min-h-[220px] px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm leading-relaxed"
            />
            {mode === "generate" && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("quickAdd.modeGenerateDesc") ||
                  "描述你的目标，让 AI 直接生成一份可保存的 Prompt 草稿"}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("prompt.type", "Prompt Type")}
              </label>
              <div className="flex gap-2">
                {(["text", "image"] as const).map((type) => {
                  const isActive = selectedPromptType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedPromptType(type)}
                      aria-pressed={isActive}
                      className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      {type === "text" ? (
                        <SparklesIcon className="w-4 h-4 shrink-0" />
                      ) : (
                        <Wand2Icon className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {type === "text"
                          ? t("prompt.typeText", "Text")
                          : t("prompt.typeImage", "Image")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("prompt.folderOptional") || "保存到文件夹（可选）"}
              </label>
              <Select
                value={selectedFolderId || ""}
                onChange={(value) => setSelectedFolderId(value || undefined)}
                placeholder={t("quickAdd.smartFolder") || "AI 智能分类"}
                options={[
                  {
                    value: "",
                    label: (
                      <div className="flex items-center gap-2">
                        <Wand2Icon className="w-4 h-4 shrink-0 text-primary" />
                        <span>{t("quickAdd.smartFolder") || "AI 智能分类"}</span>
                      </div>
                    ),
                    labelText: t("quickAdd.smartFolder") || "AI 智能分类",
                  },
                  ...folders.map((folder) => ({
                    value: folder.id,
                    label: (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 flex items-center justify-center w-4 h-4 text-muted-foreground">
                          {renderFolderIcon(folder.icon)}
                        </span>
                        <span className="truncate">{folder.name}</span>
                      </div>
                    ),
                    labelText: folder.name,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={handleCloseRequest}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {t("common.cancel") || "取消"}
          </button>
          <button
            onClick={handleCreate}
            disabled={!promptText.trim() || isSubmitting}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-primary/20"
          >
            {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {mode === "generate"
              ? t("quickAdd.generateAndCreate") || "生成并创建"
              : t("quickAdd.create") || "立即创建"}
          </button>
        </div>
      </div>
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onSave={() => {
          setShowUnsavedDialog(false);
          handleCreate();
        }}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          onClose();
        }}
      />
    </div>
  );
}
