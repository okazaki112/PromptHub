import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Prompt } from "@prompthub/shared/types";
import {
  flattenPromptTree,
  getPromptHierarchyMeta,
} from "../prompt/prompt-drag-utils";

const PROMPT_CARD_ESTIMATED_HEIGHT = 76;

export function useVirtualizedPromptListModel(
  prompts: Prompt[],
  effectiveCollapsedPromptIds: Set<string>,
  selectedPromptId?: string | null,
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const treeItems = useMemo(
    () =>
      flattenPromptTree(prompts, effectiveCollapsedPromptIds, {
        siblingOrder: "input",
      }),
    [effectiveCollapsedPromptIds, prompts],
  );
  const promptOrderKey = useMemo(
    () => treeItems.map((item) => item.prompt.id).join("\u001f"),
    [treeItems],
  );
  const hierarchyMeta = useMemo(
    () => getPromptHierarchyMeta(prompts),
    [prompts],
  );
  const rowVirtualizer = useVirtualizer({
    count: treeItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => PROMPT_CARD_ESTIMATED_HEIGHT,
    overscan: 8,
    getItemKey: (index) => treeItems[index]?.prompt.id ?? `__missing-${index}`,
  });

  const targetIndex = selectedPromptId
    ? treeItems.findIndex((item) => item.prompt.id === selectedPromptId)
    : -1;

  useEffect(() => {
    // The accordion selection hook changes collapsedPromptIds, which changes the
    // flatten order. Keep the selected prompt visible instead of snapping the
    // virtualized list to its top (the old behavior users reported as
    // "clicking a prompt with children jumps to the top").
    if (targetIndex < 0) {
      return;
    }
    rowVirtualizer.scrollToIndex(targetIndex, { align: "start" });
  }, [promptOrderKey, rowVirtualizer, targetIndex]);

  return { scrollRef, treeItems, hierarchyMeta, rowVirtualizer };
}
