import { describe, expect, it } from "vitest";
import {
  FOLDER_PALETTE,
  folderColor,
  neutralNodeColor,
  semanticEdgeVisual,
  suggestionEdgeVisual,
} from "../../../src/renderer/components/prompt/prompt-graph-semantics";

describe("prompt-graph-semantics", () => {
  describe("folderColor", () => {
    it("returns a stable colour for a given root order", () => {
      expect(folderColor(0, "dark")).toBe(FOLDER_PALETTE.dark[0]);
      expect(folderColor(3, "light")).toBe(FOLDER_PALETTE.light[3]);
      // Deterministic: same input, same output across calls.
      expect(folderColor(2, "dark")).toBe(folderColor(2, "dark"));
    });

    it("wraps around the palette instead of running out of colours", () => {
      const palette = FOLDER_PALETTE.dark;
      expect(folderColor(palette.length, "dark")).toBe(palette[0]);
      expect(folderColor(palette.length + 2, "dark")).toBe(palette[2]);
    });

    it("falls back to the neutral tone for missing/negative/unstable order", () => {
      expect(folderColor(-1, "dark")).toBe(neutralNodeColor("dark"));
      expect(folderColor(NaN, "light")).toBe(neutralNodeColor("light"));
    });

    it("keeps dark and light palettes the same length and non-empty", () => {
      expect(FOLDER_PALETTE.dark.length).toBeGreaterThan(1);
      expect(FOLDER_PALETTE.dark.length).toBe(FOLDER_PALETTE.light.length);
    });
  });

  describe("semanticEdgeVisual", () => {
    it("draws an arrowhead only for directed relation kinds", () => {
      expect(semanticEdgeVisual("depends_on", "a", "a").arrowLength).toBeGreaterThan(0);
      expect(semanticEdgeVisual("next_step", "a", "a").arrowLength).toBeGreaterThan(0);
      expect(semanticEdgeVisual("variant_of", "a", "a").arrowLength).toBeGreaterThan(0);
      expect(semanticEdgeVisual("related_to", "a", "a").arrowLength).toBe(0);
    });

    it("flips the label/direction based on which endpoint is the focus", () => {
      const outgoing = semanticEdgeVisual("depends_on", "focus", "focus");
      const incoming = semanticEdgeVisual("depends_on", "other", "focus");
      expect(outgoing.direction).toBe("outgoing");
      expect(outgoing.labelKey).toBe("prompt.relationships.dependsOn");
      expect(incoming.direction).toBe("incoming");
      expect(incoming.labelKey).toBe("prompt.relationships.requiredBy");
    });

    it("assigns a distinct colour per relation kind", () => {
      const colors = new Set(
        (["related_to", "variant_of", "depends_on", "next_step"] as const).map(
          (kind) => semanticEdgeVisual(kind, "a", "a").color,
        ),
      );
      // All four kinds must be visually separable.
      expect(colors.size).toBe(4);
    });

    it("treats a null focus as incoming without throwing", () => {
      expect(semanticEdgeVisual("next_step", "a", null).direction).toBe("incoming");
    });
  });

  describe("suggestionEdgeVisual", () => {
    it("renders candidate links as faint dotted, arrow-less overlays", () => {
      const visual = suggestionEdgeVisual("same_tag");
      expect(visual.arrowLength).toBe(0);
      expect(visual.dash).toEqual([1, 3]);
      expect(visual.labelKey).toBe("prompt.relationships.reasonSameTag");
    });

    it("maps every suggestion reason to its i18n key", () => {
      expect(suggestionEdgeVisual("same_folder").labelKey).toBe(
        "prompt.relationships.reasonSameFolder",
      );
      expect(suggestionEdgeVisual("similar_title").labelKey).toBe(
        "prompt.relationships.reasonSimilarTitle",
      );
    });
  });
});
