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
    // Selection should never move the viewport when the row is already visible.
    // Snapping every selection to the top (align:"start") caused "click any prompt
    // and the list scrolls to the top". Only scroll when the selected row is outside
    // the visible range. The virtualizer computes a row's viewport position by
    // current range: `targetIndex` between startIndex - endIndex is visible.
    if (targetIndex < 0) {
      return;
    }
    const range = rowVirtualizer.range;
    if (range && targetIndex >= range.startIndex && targetIndex <= range.endIndex) {
      return;
    }
    // "auto" moves it to the nearest edge, preserving visual continuity, instead of
    // the harsh previous reflow-to-first-page/top-row effect the user reported.
    rowVirtualizer.scrollToIndex(targetIndex, { align: "auto" });
  }, [promptOrderKey, rowVirtualizer, targetIndex]);

  return { scrollRef, treeItems, hierarchyMeta, rowVirtualizer };
}
