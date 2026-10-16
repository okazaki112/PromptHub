import type { PromptGraphRelationKind } from "@prompthub/shared/types";
import type { SuggestionReason } from "./prompt-relation-suggestions";

/**
 * Pure visual encodings for the prompt relationship graph (v0.6.5). This module
 * owns every colour / dash / arrow / label decision so the canvas renderer and
 * the overlay components stay free of scattered hex values. No React, no store,
 * no side effects — fully unit-testable.
 */

export type GraphColorMode = "dark" | "light";

export type EdgeDirection = "outgoing" | "incoming";

export interface SemanticEdgeVisual {
  color: string;
  /** 0 disables the arrowhead (undirected relations like related_to). */
  arrowLength: number;
  dash: [number, number] | null;
  labelKey: string;
  labelFallback: string;
  direction: EdgeDirection;
}

export interface SuggestionEdgeVisual {
  color: string;
  dash: [number, number];
  arrowLength: number;
  labelKey: string;
  labelFallback: string;
}

// Distinct hues per directional semantic. Chosen to stay legible on both the
// dark (#1a1a1a) and light (#fafafa) graph backgrounds.
const SEMANTIC_HUE: Record<PromptGraphRelationKind, string> = {
  related_to: "#38bdf8",
  variant_of: "#a78bfa",
  depends_on: "#f59e0b",
  next_step: "#10b981",
};

// A single, low-chroma violet reserved for candidate links so they never masquerade as real edges.
const SUGGESTION_COLOR = "#9d7bd8";

const SUGGESTION_REASON_KEYS: Record<SuggestionReason, { key: string; fallback: string }> = {
  same_tag: {
    key: "prompt.relationships.reasonSameTag",
    fallback: "Shared tag",
  },
  same_folder: {
    key: "prompt.relationships.reasonSameFolder",
    fallback: "Same folder",
  },
  similar_title: {
    key: "prompt.relationships.reasonSimilarTitle",
    fallback: "Similar title",
  },
};

// kind + direction -> i18n label + fallback (mirrors PromptRelationshipPanel wording, graph side).
const DIRECTIONAL_LABELS: Record<
  Exclude<PromptGraphRelationKind, "related_to">,
  { outgoing: { key: string; fallback: string }; incoming: { key: string; fallback: string } }
> = {
  variant_of: {
    outgoing: { key: "prompt.relationships.variantOf", fallback: "Variant of" },
    incoming: { key: "prompt.relationships.hasVariant", fallback: "Has variant" },
  },
  depends_on: {
    outgoing: { key: "prompt.relationships.dependsOn", fallback: "Depends on" },
    incoming: { key: "prompt.relationships.requiredBy", fallback: "Required by" },
  },
  next_step: {
    outgoing: { key: "prompt.relationships.nextStep", fallback: "Next step" },
    incoming: {
      key: "prompt.relationships.previousStep",
      fallback: "Previous step",
    },
  },
};

/**
 * Visual encoding for a real semantic edge. `focusPromptId` decides which way
 * the arrow/label is read (source seen as outgoing). related_to and the legacy
 * directional kinds all render coloured; only truly undirected related_to drops
 * the arrowhead.
 */
export function semanticEdgeVisual(
  kind: PromptGraphRelationKind,
  sourcePromptId: string,
  focusPromptId: string | null,
): SemanticEdgeVisual {
  const direction: EdgeDirection =
    focusPromptId && sourcePromptId === focusPromptId ? "outgoing" : "incoming";

  if (kind === "related_to") {
    return {
      color: SEMANTIC_HUE.related_to,
      arrowLength: 0,
      dash: [3, 3] as [number, number],
      labelKey: "prompt.relationships.relatedTo",
      labelFallback: "Related",
      direction,
    };
  }

  const label = DIRECTIONAL_LABELS[kind][direction];
  return {
    color: SEMANTIC_HUE[kind],
    arrowLength: 4.5,
    // Directional kinds keep a subtle dash for the v0.5 look but carry an arrow.
    dash: [5, 3] as [number, number],
    labelKey: label.key,
    labelFallback: label.fallback,
    direction,
  };
}

/** Visual encoding for a candidate (not yet committed) link. */
export function suggestionEdgeVisual(reason: SuggestionReason): SuggestionEdgeVisual {
  const meta = SUGGESTION_REASON_KEYS[reason];
  return {
    color: SUGGESTION_COLOR,
    dash: [1, 3] as [number, number],
    arrowLength: 0,
    labelKey: meta.key,
    labelFallback: meta.fallback,
  };
}

/**
 * Stable palette for root-folder group colours. Index is the root folder's
 * deterministic slot in the folder order (not hashed per render) so a folder's
 * hue never changes while browsing.
 */
export const FOLDER_PALETTE: Record<GraphColorMode, string[]> = {
  dark: [
    "#6ea8fe",
    "#f0a35e",
    "#7dd6a1",
    "#c79bf0",
    "#e07a9c",
    "#5bc8d6",
    "#d6c25b",
    "#9aa7ff",
  ],
  light: [
    "#2f6fdd",
    "#cf7a1f",
    "#2e9e63",
    "#7d4fd0",
    "#c0446e",
    "#2c93a3",
    "#93851f",
    "#4c5ee6",
  ],
};

/** Fallback fill for prompts with no folder / unresolvable root. */
export function neutralNodeColor(mode: GraphColorMode): string {
  return mode === "dark" ? "#9aa0a8" : "#6f7682";
}

/**
 * Map a root folder's stable order to a palette colour. Negative / missing
 * order yields the neutral tone.
 */
export function folderColor(
  rootOrder: number,
  mode: GraphColorMode,
): string {
  const palette = FOLDER_PALETTE[mode];
  if (!Number.isFinite(rootOrder) || rootOrder < 0) {
    return neutralNodeColor(mode);
  }
  return palette[rootOrder % palette.length];
}

/**
 * Colour coding for prompt type shown on the hover card chip. Kept separate
 * from group colour so the two encodings stay legible.
 */
export const PROMPT_TYPE_META: Record<
  "text" | "image" | "video",
  { key: string; fallback: string }
> = {
  text: { key: "prompt.graph.typeText", fallback: "Text" },
  image: { key: "prompt.graph.typeImage", fallback: "Image" },
  video: { key: "prompt.graph.typeVideo", fallback: "Video" },
};
