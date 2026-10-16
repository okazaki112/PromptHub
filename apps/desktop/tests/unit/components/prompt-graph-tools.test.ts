import { describe, expect, it } from "vitest";
import type { Prompt, PromptRelation } from "@prompthub/shared/types";
import {
  applyNodeFilters,
  buildSuggestionLinks,
  countIsolated,
  focusSubgraph,
  pruneLinksToVisibleNodes,
} from "../../../src/renderer/components/prompt/prompt-graph-tools";
import type {
  PromptGraphLink,
  PromptGraphNode,
} from "../../../src/renderer/components/prompt/prompt-graph-layout";

const base: Omit<Prompt, "id" | "title" | "tags" | "folderId" | "parentId"> = {
  userPrompt: "",
  variables: [],
  isFavorite: false,
  isPinned: false,
  version: 1,
  currentVersion: 1,
  usageCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function prompt(
  id: string,
  overrides: Partial<Prompt> = {},
): Prompt {
  return {
    ...(base as Prompt),
    id,
    title: id,
    tags: [],
    folderId: null,
    parentId: undefined,
    ...overrides,
  };
}

function makeNode(
  id: string,
  degree: number,
  extra: Partial<PromptGraphNode> = {},
): PromptGraphNode {
  return {
    id,
    title: id,
    promptType: "text",
    degree,
    hasHierarchy: false,
    hasSemanticRelation: degree > 0,
    folderId: null,
    tags: [],
    usageCount: 0,
    isFavorite: false,
    ...extra,
  };
}

function link(id: string, source: string, target: string): PromptGraphLink {
  return { id, source, target, kind: "related_to", isHierarchy: false };
}

describe("prompt-graph-tools", () => {
  describe("buildSuggestionLinks", () => {
    it("links two same-tag prompts for the focus node", () => {
      const links = buildSuggestionLinks({
        focusIds: ["a"],
        prompts: [prompt("a", { tags: ["x"] }), prompt("b", { tags: ["x"] })],
        relations: [],
      });
      expect(links).toHaveLength(1);
      expect(links[0].isSuggestion).toBe(true);
      expect(links[0].reason).toBe("same_tag");
      expect([links[0].source, links[0].target].sort()).toEqual(["a", "b"]);
    });

    it("returns nothing when there is no focus node", () => {
      const links = buildSuggestionLinks({
        focusIds: [],
        prompts: [prompt("a", { tags: ["x"] }), prompt("b", { tags: ["x"] })],
        relations: [],
      });
      expect(links).toEqual([]);
    });

    it("excludes pairs already connected by a real relation", () => {
      const links = buildSuggestionLinks({
        focusIds: ["a"],
        prompts: [prompt("a", { tags: ["x"] }), prompt("b", { tags: ["x"] })],
        relations: [
          {
            id: "r1",
            sourcePromptId: "a",
            targetPromptId: "b",
            kind: "related_to",
            note: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          } satisfies PromptRelation,
        ],
      });
      expect(links).toEqual([]);
    });

    it("excludes parent/child tree relations", () => {
      const links = buildSuggestionLinks({
        focusIds: ["parent"],
        prompts: [
          prompt("parent", { tags: ["x"] }),
          prompt("child", { tags: ["x"], parentId: "parent" }),
        ],
        relations: [],
      });
      expect(links).toEqual([]);
    });

    it("drops candidate targets hidden by the active filter", () => {
      const links = buildSuggestionLinks({
        focusIds: ["a"],
        prompts: [prompt("a", { tags: ["x"] }), prompt("b", { tags: ["x"] })],
        relations: [],
        visibleIds: new Set(["a"]),
      });
      expect(links).toEqual([]);
    });

    it("deduplicates the same pair across multiple focus nodes", () => {
      const links = buildSuggestionLinks({
        focusIds: ["a", "b"],
        prompts: [prompt("a", { tags: ["x"] }), prompt("b", { tags: ["x"] })],
        relations: [],
      });
      // a→b and b→a describe one undirected candidate; only one survives.
      expect(links).toHaveLength(1);
    });

    it("honours maxPerNode cap", () => {
      const prompts = [
        prompt("a", { tags: ["x"] }),
        prompt("b", { tags: ["x"] }),
        prompt("c", { tags: ["x"] }),
        prompt("d", { tags: ["x"] }),
      ];
      const links = buildSuggestionLinks({
        focusIds: ["a"],
        prompts,
        relations: [],
        maxPerNode: 2,
      });
      expect(links.length).toBeLessThanOrEqual(2);
    });
  });

  describe("focusSubgraph", () => {
    it("keeps the focus node, its neighbours, and only internal links", () => {
      const nodes = [makeNode("a", 1), makeNode("b", 2), makeNode("c", 1)];
      const links = [link("ab", "a", "b"), link("bc", "b", "c")];

      const sub = focusSubgraph(nodes, links, "a");

      expect(sub.nodes.map((n) => n.id).sort()).toEqual(["a", "b"]);
      expect(sub.links).toHaveLength(1);
      expect(sub.links[0].id).toBe("ab");
    });

    it("yields a single-node subgraph for an isolated focus node", () => {
      const nodes = [makeNode("a", 0), makeNode("b", 0)];
      const sub = focusSubgraph(nodes, [], "a");
      expect(sub.nodes.map((n) => n.id)).toEqual(["a"]);
      expect(sub.links).toEqual([]);
    });

    it("resolves links whose endpoints are node objects (post-tick)", () => {
      const a = makeNode("a", 0);
      const b = makeNode("b", 0);
      const nodes = [a, b];
      const objLinks: PromptGraphLink[] = [
        { id: "ab", source: a, target: b, kind: "related_to", isHierarchy: false },
      ];
      const sub = focusSubgraph(nodes, objLinks, "b");
      expect(sub.nodes.map((n) => n.id).sort()).toEqual(["a", "b"]);
      expect(sub.links).toHaveLength(1);
    });
  });

  describe("applyNodeFilters", () => {
    const nodes = [
      makeNode("a", 0, { tags: ["x"], folderId: "f1" }),
      makeNode("b", 0, { tags: ["y"], folderId: "f2" }),
      makeNode("c", 0, { tags: ["x", "y"], folderId: null }),
    ];

    it("returns everything when no criteria are supplied", () => {
      expect(applyNodeFilters(nodes, {})).toHaveLength(3);
    });

    it("matches nodes carrying any requested tag", () => {
      const filtered = applyNodeFilters(nodes, { tags: ["x"] });
      expect(filtered.map((n) => n.id).sort()).toEqual(["a", "c"]);
    });

    it("matches nodes in any requested folder", () => {
      const filtered = applyNodeFilters(nodes, { folderIds: ["f2"] });
      expect(filtered.map((n) => n.id)).toEqual(["b"]);
    });

    it("combines tag and folder criteria with OR semantics", () => {
      const filtered = applyNodeFilters(nodes, { tags: ["y"], folderIds: ["f1"] });
      expect(filtered.map((n) => n.id).sort()).toEqual(["a", "b", "c"]);
    });
  });

  describe("pruneLinksToVisibleNodes", () => {
    it("drops links touching a hidden endpoint", () => {
      const visible = [makeNode("a", 1), makeNode("b", 1)];
      const links = [link("ab", "a", "b"), link("ac", "a", "c")];
      expect(pruneLinksToVisibleNodes(links, visible)).toHaveLength(1);
    });
  });

  describe("countIsolated", () => {
    it("counts nodes with zero degree", () => {
      const nodes = [makeNode("a", 0), makeNode("b", 3), makeNode("c", 0)];
      expect(countIsolated(nodes)).toBe(2);
    });

    it("returns 0 for an empty graph", () => {
      expect(countIsolated([])).toBe(0);
    });
  });
});
