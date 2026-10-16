import type { Prompt } from "@prompthub/shared/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVirtualizedPromptListModel } from "../../../src/renderer/components/layout/useVirtualizedPromptListModel";

const scrollToIndex = vi.hoisted(() => vi.fn());

// @tanstack/react-virtual requires a measured DOM container. Keep the virtualizer
// identity stable and stub the one method that our scroll behavior controls.
vi.mock("@tanstack/react-virtual", () => {
  const instance = {
    scrollToIndex,
    measure: () => {
      // no layout measurement required for this hook unit test
    },
    scrollToEnd: () => {
      // no layout measurement required for this hook unit test
    },
  };
  return { useVirtualizer: () => instance };
});

function prompt(id: string, parentId?: string): Prompt {
  const value: Prompt = {
    id,
    title: id,
    userPrompt: `${id} body`,
    variables: [],
    tags: [],
    isFavorite: false,
    isPinned: false,
    version: 1,
    currentVersion: 1,
    usageCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  if (parentId) {
    value.parentId = parentId;
  }
  return value;
}

const prompts = [prompt("a"), prompt("a1", "a"), prompt("a2", "a"), prompt("b")];

interface HookProps {
  collapsed: Iterable<string>;
  selectedId: string | null;
}

function useModel(props: HookProps) {
  return useVirtualizedPromptListModel(
    prompts,
    new Set(props.collapsed),
    props.selectedId,
  );
}

describe("useVirtualizedPromptListModel scroll behavior", () => {
  beforeEach(() => {
    scrollToIndex.mockClear();
  });

  it("does not call scrollToIndex(top) when no selected prompt is visible", () => {
    const { rerender } = renderHook(
      (props: HookProps) => useModel(props),
      {
        initialProps: { collapsed: [] as Iterable<string>, selectedId: null },
      },
    );
    expect(scrollToIndex).not.toHaveBeenCalled();

    // Accordion collapse (no selection) changes order; should keep position.
    rerender({ collapsed: ["a"], selectedId: null });
    expect(scrollToIndex).not.toHaveBeenCalled();

    // Selected descendant hidden by collapsed parent: preserve current view.
    rerender({ collapsed: ["a"], selectedId: "a1" });
    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  it("scrolls the selected prompt into view when order or selected id changes", () => {
    const { rerender } = renderHook(
      (props: HookProps) => useModel(props),
      {
        initialProps: {
          collapsed: ["b"],
          selectedId: "b",
        } satisfies HookProps,
      },
    );

    // a, a1, a2, b (collapsed b has no visible children). Index: b=3.
    expect(scrollToIndex).toHaveBeenCalledTimes(1);
    expect(scrollToIndex).toHaveBeenCalledWith(3, { align: "start" });

    scrollToIndex.mockClear();
    rerender({ collapsed: ["b"], selectedId: "a" });
    expect(scrollToIndex).toHaveBeenCalledWith(0, { align: "start" });
  });

  it("scrolls to the new selected index after accordion collapse", () => {
    const { rerender } = renderHook(
      (props: HookProps) => useModel(props),
      {
        initialProps: {
          collapsed: [] as Iterable<string>,
          selectedId: "b",
        } satisfies HookProps,
      },
    );

    // expanded [a,a1,a2,b] -> b index 3
    expect(scrollToIndex).toHaveBeenCalledWith(3, { align: "start" });

    scrollToIndex.mockClear();
    rerender({ collapsed: ["a"], selectedId: "b" });
    expect(scrollToIndex).toHaveBeenCalledWith(1, { align: "start" });
  });
});
