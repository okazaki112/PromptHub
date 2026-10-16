import { fireEvent, screen } from "@testing-library/react";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prompt, PromptRelation } from "@prompthub/shared/types";

import { PromptGraphView } from "../../../src/renderer/components/prompt/PromptGraphView";
import {
  buildPromptGraphData,
  createPromptGraphLinks,
  getNodeVal,
  shouldShowNodeLabel,
  type PromptGraphNode,
} from "../../../src/renderer/components/prompt/prompt-graph-layout";
import { renderWithI18n } from "../../helpers/i18n";

// react-force-graph-2d renders to a real <canvas> via an internal WebGL/2D
// kapsule that jsdom cannot drive. We replace it with a DOM stub that captures
// the props we hand it, so the tests can assert the data contract and the React
// glue (selection callback, node count) without a live canvas.
const graphProps = vi.hoisted(() => ({ current: null as any }));
const createRelationMock = vi.hoisted(() =>
  vi.fn(async (_data: unknown) => ({} as never)),
);

// The view commits candidate links through the prompt store action; stub the
// store so the component unit test can observe the commit without touching IPC.
vi.mock("../../../src/renderer/stores/prompt.store", () => ({
  usePromptStore: vi.fn((selector: any) =>
    selector({ createRelation: createRelationMock }),
  ),
}));

vi.mock("react-force-graph-2d", () => ({
  __esModule: true,
  default: forwardRef((props: any, _ref) => {
    graphProps.current = props;
    return (
      <div
        data-testid="force-graph-mock"
        data-node-count={props.graphData.nodes.length}
        data-link-count={props.graphData.links.length}
      >
        {props.graphData.nodes.map((node: PromptGraphNode) => (
          <button
            key={node.id}
            type="button"
            data-testid={`graph-node-${node.id}`}
            onClick={() => props.onNodeClick?.(node)}
            onDoubleClick={() => props.onNodeDoubleClick?.(node)}
            onMouseEnter={() => props.onNodeHover?.(node)}
            onMouseLeave={() => props.onNodeHover?.(null)}
          >
            {node.title}
          </button>
        ))}
        {props.graphData.links
          .filter((l: any) => l.isSuggestion === true)
          .map((l: any) => (
            <button
              key={l.id}
              type="button"
              data-testid={`graph-link-${l.id}`}
              onClick={() => props.onLinkClick?.(l)}
            >
              suggested
            </button>
          ))}
      </div>
    );
  }),
}));

const basePrompt: Prompt = {
  id: "prompt-parent",
  title: "Parent prompt",
  description: "Top level prompt",
  promptType: "text",
  systemPrompt: "",
  userPrompt: "Parent body",
  variables: [],
  tags: [],
  folderId: null,
  isFavorite: false,
  isPinned: false,
  version: 1,
  currentVersion: 1,
  usageCount: 0,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

function createPrompt(id: string, title: string, parentId?: string): Prompt {
  return { ...basePrompt, id, title, parentId };
}

function makeGraphPrompt(id: string, overrides: Partial<Prompt> = {}): Prompt {
  return { ...basePrompt, id, title: id, ...overrides };
}

function makeRelation(source: string, target: string, kind?: PromptRelation["kind"]): PromptRelation {
  return {
    id: `rel-${source}-${target}`,
    sourcePromptId: source,
    targetPromptId: target,
    kind: kind ?? "related_to",
    note: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
}

const parentPrompt = basePrompt;
const childPrompt = createPrompt("prompt-child", "Child prompt", parentPrompt.id);
const relatedPrompt = createPrompt("prompt-related", "Related prompt");

const relation: PromptRelation = {
  id: "relation-1",
  sourcePromptId: childPrompt.id,
  targetPromptId: relatedPrompt.id,
  kind: "depends_on",
  note: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("PromptGraphView", () => {
  it("feeds every prompt and both relation kinds into the force graph", async () => {
    const onSelectPrompt = vi.fn();

    await renderWithI18n(
      <PromptGraphView
        prompts={[parentPrompt, childPrompt, relatedPrompt]}
        relations={[relation]}
        selectedPromptId={childPrompt.id}
        onSelectPrompt={onSelectPrompt}
      />,
      { language: "en" },
    );

    const mock = screen.getByTestId("force-graph-mock");
    expect(mock.getAttribute("data-node-count")).toBe("3");
    // 1 hierarchy link (parent → child) + 1 semantic link (child → related).
    expect(mock.getAttribute("data-link-count")).toBe("2");

    fireEvent.click(screen.getByTestId("graph-node-prompt-child"));
    expect(onSelectPrompt).toHaveBeenCalledWith(childPrompt.id);
  });

  it("exposes zoom and view controls in the graph workspace", async () => {
    await renderWithI18n(
      <PromptGraphView
        prompts={[parentPrompt, childPrompt, relatedPrompt]}
        relations={[relation]}
        selectedPromptId={childPrompt.id}
        onSelectPrompt={vi.fn()}
      />,
      { language: "en" },
    );

    expect(
      screen.getByRole("button", { name: "Zoom in graph" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Zoom out graph" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fit graph to screen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset graph view" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state without relying on filters", async () => {
    await renderWithI18n(
      <PromptGraphView
        prompts={[]}
        relations={[]}
        selectedPromptId={null}
        onSelectPrompt={vi.fn()}
      />,
      { language: "en" },
    );

    expect(screen.getByText("No prompts to map yet")).toBeInTheDocument();
  });
});

describe("prompt graph data model", () => {
  it("creates hierarchy and semantic links between matching prompts", () => {
    const links = createPromptGraphLinks(
      [parentPrompt, childPrompt, relatedPrompt],
      [relation],
    );

    const hierarchy = links.find((link) => link.isHierarchy);
    const semantic = links.find((link) => !link.isHierarchy);

    expect(hierarchy).toMatchObject({
      source: parentPrompt.id,
      target: childPrompt.id,
      kind: "grouped_under",
    });
    expect(semantic).toMatchObject({
      source: childPrompt.id,
      target: relatedPrompt.id,
      kind: "depends_on",
    });
  });

  it("counts node degree so hubs render larger", () => {
    const { nodes } = buildPromptGraphData(
      [parentPrompt, childPrompt, relatedPrompt],
      [relation],
    );

    const child = nodes.find((node) => node.id === childPrompt.id);
    const related = nodes.find((node) => node.id === relatedPrompt.id);

    // Child has two connections (parent hierarchy + related semantic).
    expect(child?.degree).toBe(2);
    expect(related?.degree).toBe(1);
    expect(getNodeVal(child!)).toBeGreaterThan(getNodeVal(related!));
  });

  it("hides isolated labels until zoomed in on dense graphs", () => {
    const isolated: PromptGraphNode = {
      id: "isolated",
      title: "Isolated",
      promptType: "text",
      degree: 0,
      hasHierarchy: false,
      hasSemanticRelation: false,
    };

    // Below the isolated-label zoom threshold, dense-graph isolated labels hide.
    expect(shouldShowNodeLabel(isolated, 80, null, new Set(), 1)).toBe(false);
    // Once zoomed past the threshold they appear.
    expect(shouldShowNodeLabel(isolated, 80, null, new Set(), 3)).toBe(true);
    // Always visible on small graphs regardless of zoom.
    expect(shouldShowNodeLabel(isolated, 10, null, new Set(), 0.3)).toBe(true);
  });

  it("always shows labels for the highlighted node and its neighbours", () => {
    const connected: PromptGraphNode = {
      id: "connected",
      title: "Connected",
      promptType: "text",
      degree: 3,
      hasHierarchy: false,
      hasSemanticRelation: true,
    };

    expect(
      shouldShowNodeLabel(connected, 200, "connected", new Set(), 0.4),
    ).toBe(true);
    expect(
      shouldShowNodeLabel(
        connected,
        200,
        "other",
        new Set(["connected"]),
        0.4,
      ),
    ).toBe(true);
  });
});

describe("PromoptGraphView value tiers", () => {
  async function renderGraph(
    prompts: Prompt[],
    relations: PromptRelation[] = [],
    selectedPromptId: string | null = null,
  ) {
    graphProps.current = null;
    await renderWithI18n(
      <PromptGraphView
        prompts={prompts}
        relations={relations}
        selectedPromptId={selectedPromptId}
        onSelectPrompt={vi.fn()}
      />,
      { language: "en" },
    );
  }

  it("surfaces candidate links for the selected node and commits them", async () => {
    const prompts = [
      makeGraphPrompt("cand-a", { tags: ["shared"] }),
      makeGraphPrompt("cand-b", { tags: ["shared"] }),
    ];
    await renderGraph(prompts, [], "cand-a");
    const [candidateLink] = graphProps.current.graphData.links;
    expect(candidateLink).toMatchObject({ isSuggestion: true, reason: "same_tag" });
    fireEvent.click(screen.getByTestId(`graph-link-${candidateLink.id}`));
    expect(createRelationMock).toHaveBeenCalledWith({
      sourcePromptId: "cand-a",
      targetPromptId: "cand-b",
      kind: "related_to",
    });
  });

  it("keeps candidate links off while no node is hovered or selected", async () => {
    const prompts = [
      makeGraphPrompt("cand-a", { tags: ["shared"] }),
      makeGraphPrompt("cand-b", { tags: ["shared"] }),
    ];
    await renderGraph(prompts);
    expect(graphProps.current.graphData.links.filter((l: any) => l.isSuggestion)).toHaveLength(0);
  });

  it("shows the usage number in the hover card and hides it after leaving", async () => {
    await renderGraph([makeGraphPrompt("hover-a", { usageCount: 7 })]);
    fireEvent.mouseEnter(screen.getByTestId("graph-node-hover-a"));
    expect(screen.getByText("7 uses")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByTestId("graph-node-hover-a"));
    expect(screen.queryByText("7 uses")).not.toBeInTheDocument();
  });

  it("toggles a focus subgraph and restores the full graph via Exit focus", async () => {
    const relation = makeRelation("focus-a", "focus-b");
    const prompts = [
      makeGraphPrompt("focus-a"),
      makeGraphPrompt("focus-b"),
      makeGraphPrompt("focus-c"),
    ];
    await renderGraph(prompts, [relation], "focus-a");
    expect(graphProps.current.graphData.nodes).toHaveLength(3);
    fireEvent.click(screen.getByTestId("graph-node-focus-a"));
    expect(graphProps.current.graphData.nodes).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Exit focus" }));
    expect(graphProps.current.graphData.nodes).toHaveLength(3);
  });

  it("reveals the edge/size legend when toggled", async () => {
    await renderGraph([makeGraphPrompt("legend-a")]);
    expect(screen.queryByText("Legend")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Toggle legend" }));
    expect(screen.getByText("Legend")).toBeInTheDocument();
  });

  it("counts unlinked prompts in the health badge", async () => {
    await renderGraph([makeGraphPrompt("iso-a"), makeGraphPrompt("iso-b")]);
    expect(screen.getByText("2 unlinked")).toBeInTheDocument();
  });

  it("narrows the graph when a tag filter is applied", async () => {
    const prompts = [
      makeGraphPrompt("tag-a", { tags: ["x"] }),
      makeGraphPrompt("tag-b", { tags: ["y"] }),
    ];
    await renderGraph(prompts);
    expect(graphProps.current.graphData.nodes).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "#x" }));
    expect(graphProps.current.graphData.nodes).toHaveLength(1);
  });

  it("colours and arrows directional edges but not undirected relations", async () => {
    const prompts = [makeGraphPrompt("edge-a"), makeGraphPrompt("edge-b")];
    await renderGraph(prompts, [makeRelation("edge-a", "edge-b", "depends_on")], "edge-a");
    const dependsOn = {
      id: "x",
      source: "edge-a",
      target: "edge-b",
      kind: "depends_on",
      isHierarchy: false,
    };
    expect(graphProps.current.linkColor(dependsOn)).toBe("#f59e0b");
    expect(graphProps.current.linkDirectionalArrowLength(dependsOn)).toBeGreaterThan(0);
    const related = {
      id: "y",
      source: "edge-a",
      target: "edge-b",
      kind: "related_to",
      isHierarchy: false,
    };
    expect(graphProps.current.linkDirectionalArrowLength(related)).toBe(0);
  });
});

