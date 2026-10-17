import type { Prompt } from "@prompthub/shared/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVirtualizedPromptListModel } from "../../../src/renderer/components/layout/useVirtualizedPromptListModel";

const scrollToIndex = vi.hoisted(() => vi.fn());
const viewportRange = vi.hoisted(() => ({
  value: null as null | { startIndex: number; endIndex: number },
}));

vi.mock("@tanstack/react-virtual", () => {
  const instance = {
    scrollToIndex,
    measure: () => undefined,
    get range() {
      return viewportRange.value;
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
    viewportRange.value = { startIndex: 0, endIndex: 100 };
    scrollToIndex.mockClear();
  });

  it("preserves position when no visible selected target is present", () => {
    const { rerender } = renderHook((props: HookProps) => useModel(props), {
      initialProps: { collapsed: [] as Iterable<string>, selectedId: null },
    });
    expect(scrollToIndex).not.toHaveBeenCalled();

    // Collapse parent a -> a1 no longer exists in flatten; targetIndex=-1, not top.
    rerender({ collapsed: ["a"], selectedId: "a1" });
    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  it("does not move the list when selected target is already inside the visible range", () => {
    // Flatten indices: a=0, a1=1, a2=2, b=3. Viewport includes rows 0..3.
    viewportRange.value = { startIndex: 0, endIndex: 3 };
    const { rerender } = renderHook((props: HookProps) => useModel(props), {
      initialProps: { collapsed: [] as string[], selectedId: "a" },
    });
    rerender({ collapsed: [], selectedId: "a1" });
    rerender({ collapsed: [], selectedId: "a2" });
    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  it("brings an out-of-viewport selection into view by nearest edge, not top", () => {
    // Viewport only row 0; select b (row 3). Auto-alignment preserves continuity.
    viewportRange.value = { startIndex: 0, endIndex: 0 };
    const { rerender } = renderHook((props: HookProps) => useModel(props), {
      initialProps: { collapsed: [] as Iterable<string>, selectedId: "a" },
    });
    expect(scrollToIndex).not.toHaveBeenCalled();
    viewportRange.value = { startIndex: 0, endIndex: 0 };
    rerender({ collapsed: [], selectedId: "b" });
    expect(scrollToIndex).toHaveBeenCalledWith(3, { align: "auto" });
  });

  it("re-aligns after an accordion reorder places target row outside range", () => {
    viewportRange.value = { startIndex: 1, endIndex: 3 };
    const { rerender } = renderHook((props: HookProps) => useModel(props), {
      initialProps: { collapsed: ["b"], selectedId: "b" },
    });
    // collapsed b: a=0,a1=1,a2=2,b=3. range=1..3 includes3 so no scroll.
    expect(scrollToIndex).not.toHaveBeenCalled();
    viewportRange.value = { startIndex: 0, endIndex: 0 };
    rerender({ collapsed: ["b"], selectedId: "a" });
    // selected a index0 still visible because range starts at 0? yes target=0, no scroll.
    expect(scrollToIndex).not.toHaveBeenCalled();
    // selected a1 index1, out of viewport 0..0 -> nearest scroll.
    viewportRange.value = { startIndex: 0, endIndex: 0 };
    rerender({ collapsed: ["b"], selectedId: "a1" });
    expect(scrollToIndex).toHaveBeenCalledWith(1, { align: "auto" });
  });
});
