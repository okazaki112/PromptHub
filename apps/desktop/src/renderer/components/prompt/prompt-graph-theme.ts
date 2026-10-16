// Graph canvas palettes, split out of PromptGraphView to keep the renderer
// component within its size budget. Values align with settings dark/light mode.
export interface GraphThemeColors {
  background: string;
  nodeIsolated: string;
  nodeConnected: string;
  nodeAccent: string;
  nodeSelected: string;
  nodeDimmed: string;
  nodeSelectedRing: string;
  link: string;
  linkActive: string;
  linkSelected: string;
  label: string;
  labelActive: string;
  labelHalo: string;
}

export const GRAPH_THEME: { dark: GraphThemeColors; light: GraphThemeColors } = {
  dark: {
    background: "#1a1a1a",
    nodeIsolated: "#9aa0a8",
    nodeConnected: "#c2c8d2",
    nodeAccent: "#e2e7ef",
    nodeSelected: "#4c8dff",
    nodeDimmed: "rgba(150, 156, 166, 0.28)",
    nodeSelectedRing: "rgba(76, 141, 255, 0.4)",
    link: "rgba(190, 196, 208, 0.22)",
    linkActive: "rgba(96, 160, 255, 0.9)",
    linkSelected: "rgba(76, 141, 255, 0.6)",
    label: "rgba(214, 220, 230, 0.92)",
    labelActive: "#ffffff",
    labelHalo: "#1a1a1a",
  },
  light: {
    background: "#fafafa",
    nodeIsolated: "#9298a2",
    nodeConnected: "#6f7682",
    nodeAccent: "#454c58",
    nodeSelected: "#2f7bf6",
    nodeDimmed: "rgba(110, 118, 130, 0.22)",
    nodeSelectedRing: "rgba(47, 123, 246, 0.35)",
    link: "rgba(60, 66, 78, 0.28)",
    linkActive: "rgba(47, 123, 246, 0.9)",
    linkSelected: "rgba(47, 123, 246, 0.55)",
    label: "rgba(42, 48, 58, 0.95)",
    labelActive: "#10151f",
    labelHalo: "#fafafa",
  },
};

export const ZOOM_STEP = 1.35;
