import type { Prompt, PromptRelation } from "@prompthub/shared/types";
import {
  buildRelationSuggestions,
  type SuggestionReason,
} from "./prompt-relation-suggestions";
import type {
  PromptGraphLink,
  PromptGraphNode,
  PromptGraphSuggestionLink,
} from "./prompt-graph-layout";

/**
 * Derived graph helpers for v0.6.5 (candidate edges, focus neighbourhood,
 * filters, isolated count). Pure functions only — no React, no persistence.
 * Candidate edges are view-local overlays: they become real PromptRelation rows
 * only after the user commits them via the store's createRelation, and are
 * rebuilt each render for the hovered/selected node.
 */

export interface SuggestionBuildInput {
  /** Node ids whose candidate links should be surfaced (hover + selected). */
  focusIds: string[];
  prompts: Prompt[];
  relations: PromptRelation[];
  /** When provided, targets outside this set are dropped (post-filter visible ids). */
  visibleIds?: Set<string>;
  /** Cap per focus node; defaults to the suggestion engine's own limit. */
  maxPerNode?: number;
}

/**
 * Build candidate links for the focus nodes only. Excludes anything already
 * semantically linked, parent/child tree relations, the node itself, already
 * emitted pairs, and (optionally) nodes hidden by an active filter.
 */
export function buildSuggestionLinks({
  focusIds,
  prompts,
  relations,
  visibleIds,
  maxPerNode,
}: SuggestionBuildInput): PromptGraphSuggestionLink[] {
  if (focusIds.length === 0) {
    return [];
  }

  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));

  // Which prompt ids share a real semantic edge, keyed by prompt.
  const connectedIds = new Map<string, Set<string>>();
  const registerConnection = (a: string, b: string) => {
    const set = connectedIds.get(a) ?? new Set<string>();
    set.add(b);
    connectedIds.set(a, set);
  };
  for (const relation of relations) {
    registerConnection(relation.sourcePromptId, relation.targetPromptId);
    registerConnection(relation.targetPromptId, relation.sourcePromptId);
  }

  const usedPairs = new Set<string>();
  const links: PromptGraphSuggestionLink[] = [];

  const pushLink = (
    focus: Prompt,
    target: Prompt,
    reason: SuggestionReason,
    sharedTag?: string,
  ) => {
    const key = [focus.id, target.id].sort().join("|");
    if (usedPairs.has(key)) {
      return;
    }
    usedPairs.add(key);
    links.push({
      id: `suggested:${focus.id}:${target.id}`,
      source: focus.id,
      target: target.id,
      kind: "related_to",
      isHierarchy: false,
      isSuggestion: true,
      reason,
      sharedTag,
    });
  };

  for (const focusId of focusIds) {
    const focus = promptById.get(focusId);
    if (!focus) {
      continue;
    }

    const excluded = new Set<string>();
    excluded.add(focus.id);
    for (const linked of connectedIds.get(focus.id) ?? []) {
      excluded.add(linked);
    }
    if (focus.parentId) {
      excluded.add(focus.parentId);
    }
    for (const prompt of prompts) {
      if (prompt.parentId === focus.id) {
        excluded.add(prompt.id);
      }
    }

    if (visibleIds) {
      for (const prompt of prompts) {
        if (!visibleIds.has(prompt.id)) {
          excluded.add(prompt.id);
        }
      }
    }

    const suggestions = buildRelationSuggestions(focus, prompts, excluded);
    const limit = maxPerNode ?? suggestions.length;
    for (const suggestion of suggestions.slice(0, limit)) {
      pushLink(focus, suggestion.prompt, suggestion.reason, suggestion.sharedTag);
    }
  }

  return links;
}

/**
 * Trim a graph to an ego neighbourhood: the focus node plus its direct
 * neighbours, keeping only links where both endpoints survived. Isolated-focus
 * nodes still yield a single-node subgraph rather than an empty graph.
 */
export function focusSubgraph(
  nodes: PromptGraphNode[],
  links: PromptGraphLink[],
  focusId: string,
): { nodes: PromptGraphNode[]; links: PromptGraphLink[] } {
  const keep = new Set<string>([focusId]);
  for (const link of links) {
    const sourceId = typeof link.source === "string" ? link.source : link.source.id;
    const targetId = typeof link.target === "string" ? link.target : link.target.id;
    if (sourceId === focusId) {
      keep.add(targetId);
    } else if (targetId === focusId) {
      keep.add(sourceId);
    }
  }

  const keptNodes = nodes.filter((node) => keep.has(node.id));
  const keptLinks = links.filter((link) => {
    const sourceId = typeof link.source === "string" ? link.source : link.source.id;
    const targetId = typeof link.target === "string" ? link.target : link.target.id;
    return keep.has(sourceId) && keep.has(targetId);
  });

  return { nodes: keptNodes, links: keptLinks };
}

/**
 * Narrow which nodes survive a filter. A node matches if it carries ANY of the
 * requested tags OR belongs to ANY of the requested folders; empty criteria keeps
 * everything.
 */
export function applyNodeFilters(
  nodes: PromptGraphNode[],
  criteria: { tags?: string[]; folderIds?: string[] },
): PromptGraphNode[] {
  const tags = criteria.tags ?? [];
  const folders = criteria.folderIds ?? [];
  if (tags.length === 0 && folders.length === 0) {
    return nodes;
  }

  const folderSet = new Set(folders);
  return nodes.filter((node) => {
    if (node.folderId && folderSet.has(node.folderId)) {
      return true;
    }
    if (tags.length === 0) {
      return false;
    }
    return tags.some((tag) => node.tags.includes(tag));
  });
}

/** Keep only links whose endpoints both survived the node filter. */
export function pruneLinksToVisibleNodes(
  links: PromptGraphLink[],
  visibleNodes: PromptGraphNode[],
): PromptGraphLink[] {
  const visible = new Set(visibleNodes.map((node) => node.id));
  return links.filter((link) => {
    const sourceId = typeof link.source === "string" ? link.source : link.source.id;
    const targetId = typeof link.target === "string" ? link.target : link.target.id;
    return visible.has(sourceId) && visible.has(targetId);
  });
}

/** Prompts that carry no edge at all — used for the isolated-node health badge. */
export function countIsolated(nodes: PromptGraphNode[]): number {
  return nodes.reduce((count, node) => count + (node.degree === 0 ? 1 : 0), 0);
}
