import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { forceCollide, forceManyBody, forceX, forceY } from "d3-force";
import { useTranslation } from "react-i18next";
import ForceGraph2D, {
  type ForceGraphMethods,
  type NodeObject,
  type LinkObject,
} from "react-force-graph-2d";
import type { Folder, Prompt, PromptRelation } from "@prompthub/shared/types";
import { useSettingsStore } from "../../stores/settings.store";
import { useFolderStore } from "../../stores/folder.store";
import { usePromptStore } from "../../stores/prompt.store";
import {
  buildNeighborIndex,
  buildPromptGraphData,
  getNodeVal,
  shouldShowNodeLabel,
  type PromptGraphNode,
  type PromptGraphLink,
  type PromptGraphSuggestionLink,
} from "./prompt-graph-layout";
import {
  folderColor,
  semanticEdgeVisual,
  suggestionEdgeVisual,
  type GraphColorMode,
} from "./prompt-graph-semantics";
import {
  applyNodeFilters,
  buildSuggestionLinks,
  countIsolated,
  focusSubgraph,
  pruneLinksToVisibleNodes,
} from "./prompt-graph-tools";
import {
  GraphControls,
  GraphFilterBar,
  GraphLegend,
  NodeHoverCard,
  type HoverCardData,
} from "./graph-overlays";
import { GRAPH_THEME, ZOOM_STEP } from "./prompt-graph-theme";

interface PromptGraphViewProps {
  prompts: Prompt[];
  relations: PromptRelation[];
  selectedPromptId: string | null;
  onSelectPrompt: (promptId: string) => void;
}

type GraphNodeRef = ForceGraphMethods<PromptGraphNode, PromptGraphLink>;

function useContainerSize(): [
  React.RefObject<HTMLDivElement>,
  { width: number; height: number },
] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const update = () =>
      setSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

// Map each prompt folderId to a stable root-folder index so sibling/child
// folders inherit the same colour. Unresolved → -1 → neutral tone.
function buildFolderRootIndex(folders: Folder[]): Map<string, number> {
  const rootFolders = folders.filter((f) => !f.parentId);
  const order = rootFolders
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((f) => f.id);
  const rootOrderByFolder = new Map<string, number>();
  order.forEach((rootId, index) => {
    rootOrderByFolder.set(rootId, index);
  });
  const folderById = new Map(folders.map((f) => [f.id, f]));

  const resolveRoot = (folderId: string): number => {
    const seen = new Set<string>();
    let current: Folder | undefined = folderById.get(folderId);
    let guard = 0;
    while (current && guard < 50) {
      if (seen.has(current.id)) {
        break;
      }
      seen.add(current.id);
      const parentId = current.parentId;
      if (!parentId || !folderById.has(parentId)) {
        break;
      }
      current = folderById.get(parentId);
      guard += 1;
    }
    if (!current) {
      const found = order.indexOf(folderId);
      return found >= 0 ? found : -1;
    }
    return rootOrderByFolder.get(current.id) ?? -1;
  };

  const map = new Map<string, number>();
  for (const folder of folders) {
    map.set(folder.id, resolveRoot(folder.id));
  }
  return map;
}

// v0.6.5 关系图谱三档价值增强：
// 1) 节点底色=根文件夹 + 尺寸=degree叠加usage + 语义边分色/箭头 + 图例 + hover 卡片
// 2) 选中/hover 节点亮起其候选关联淡点线（一键落库 related_to，其余节点保持默认）
// 3) 双击进入邻域焦点子图 + tag/folder 过滤 + 孤岛健康度
export function PromptGraphView({
  prompts,
  relations,
  selectedPromptId,
  onSelectPrompt,
}: PromptGraphViewProps) {
  const { t } = useTranslation();
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const motionPreference = useSettingsStore((s) => s.motionPreference);
  const folders = useFolderStore((s) => s.folders);
  const createRelation = usePromptStore((s) => s.createRelation);
  const theme = isDarkMode ? GRAPH_THEME.dark : GRAPH_THEME.light;
  const colorMode: GraphColorMode = isDarkMode ? "dark" : "light";

  const graphRef = useRef<GraphNodeRef | undefined>(undefined);
  const [containerRef, size] = useContainerSize();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [legendOpen, setLegendOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);

  const folderRootIndex = useMemo(() => buildFolderRootIndex(folders), [folders]);
  const graphData = useMemo(
    () => buildPromptGraphData(prompts, relations),
    [prompts, relations],
  );

  const availableTags = useMemo(
    () => [...new Set(prompts.flatMap((p) => p.tags ?? []))].sort(),
    [prompts],
  );
  const rootFolderOptions = useMemo(
    () =>
      folders
        .filter((f) => !f.parentId)
        .map((f) => ({ id: f.id, name: f.name })),
    [folders],
  );
  const folderNameById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder.name])),
    [folders],
  );

  const filteredNodes = useMemo(
    () =>
      applyNodeFilters(graphData.nodes, {
        tags: selectedTags,
        folderIds: selectedFolderIds,
      }),
    [graphData.nodes, selectedTags, selectedFolderIds],
  );
  const visibleFilteredLinks = useMemo(
    () => pruneLinksToVisibleNodes(graphData.links, filteredNodes),
    [graphData.links, filteredNodes],
  );

  const baseGraph = useMemo(
    () =>
      focusId && filteredNodes.some((n) => n.id === focusId)
        ? focusSubgraph(filteredNodes, visibleFilteredLinks, focusId)
        : { nodes: filteredNodes, links: visibleFilteredLinks },
    [filteredNodes, visibleFilteredLinks, focusId],
  );

  const neighborIndex = useMemo(
    () => buildNeighborIndex(baseGraph.links),
    [baseGraph.links],
  );
  const highlightedId = hoveredId ?? selectedPromptId;
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!highlightedId) {
      return ids;
    }
    ids.add(highlightedId);
    for (const nid of neighborIndex.get(highlightedId) ?? []) {
      ids.add(nid);
    }
    return ids;
  }, [highlightedId, neighborIndex]);

  const suggestionFocusIds = useMemo(() => {
    const ids = new Set<string>();
    if (hoveredId) ids.add(hoveredId);
    if (selectedPromptId) ids.add(selectedPromptId);
    return [...ids];
  }, [hoveredId, selectedPromptId]);
  const visibleIdSet = useMemo(
    () => new Set(baseGraph.nodes.map((n) => n.id)),
    [baseGraph.nodes],
  );
  const candidateLinks = useMemo(
    () =>
      buildSuggestionLinks({
        focusIds: suggestionFocusIds,
        prompts,
        relations,
        visibleIds: visibleIdSet,
        maxPerNode: 6,
      }),
    [suggestionFocusIds, prompts, relations, visibleIdSet],
  );

  const graphLinksWithCandidates = useMemo<PromptGraphLink[]>(
    () => [...baseGraph.links, ...candidateLinks],
    [baseGraph.links, candidateLinks],
  );
  const renderedGraphData = useMemo(
    () => ({ nodes: baseGraph.nodes, links: graphLinksWithCandidates }),
    [baseGraph.nodes, graphLinksWithCandidates],
  );
  const isolatedCount = useMemo(
    () => countIsolated(baseGraph.nodes),
    [baseGraph.nodes],
  );
  const candidateCountByFocus = useMemo(() => {
    const count = new Map<string, number>();
    for (const link of candidateLinks) {
      const source = typeof link.source === "string" ? link.source : link.source.id;
      const target = typeof link.target === "string" ? link.target : link.target.id;
      count.set(source, (count.get(source) ?? 0) + 1);
      count.set(target, (count.get(target) ?? 0) + 1);
    }
    return count;
  }, [candidateLinks]);

  const nodeColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of baseGraph.nodes) {
      const rootIndex = node.folderId
        ? (folderRootIndex.get(node.folderId) ?? -1)
        : -1;
      map.set(node.id, folderColor(rootIndex, colorMode));
    }
    return map;
  }, [baseGraph.nodes, folderRootIndex, colorMode]);

  // Keep the v0.5 tuned force profile (Obsidian-style compact equilibrium),
  // but re-apply per render set (candidate links) without exploding the sim.
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    graph.d3Force(
      "charge",
      forceManyBody<PromptGraphNode>().strength(-90).distanceMax(260),
    );
    graph.d3Force(
      "collide",
      forceCollide<PromptGraphNode>()
        .radius((node) => Math.sqrt(getNodeVal(node)) * 3.2 + 14)
        .strength(0.85)
        .iterations(2),
    );
    const link = graph.d3Force("link");
    link
      ?.distance((edge: PromptGraphLink) => (edge.isHierarchy ? 36 : 58))
      .strength((edge: PromptGraphLink) => {
        const source = edge.source as PromptGraphNode;
        const target = edge.target as PromptGraphNode;
        const degree = 1 / Math.min(source.degree + 1, target.degree + 1);
        return "isSuggestion" in edge && edge.isSuggestion ? degree * 0.5 : degree;
      });
    graph.d3Force("center", null);
    graph.d3Force("x", forceX<PromptGraphNode>(0).strength(0.06));
    graph.d3Force("y", forceY<PromptGraphNode>(0).strength(0.06));
    graph.d3ReheatSimulation();
  }, [renderedGraphData]);

  const motionConfig = useMemo(() => {
    if (motionPreference === "off") {
      return { warmupTicks: 200, cooldownTicks: 0, alphaDecay: 0.1 };
    }
    if (motionPreference === "reduced") {
      return { warmupTicks: 40, cooldownTicks: 60, alphaDecay: 0.06 };
    }
    return { warmupTicks: 0, cooldownTicks: 200, alphaDecay: 0.0228 };
  }, [motionPreference]);

  const handleZoom = useCallback((transform: { k: number }) => {
    setZoomLevel(transform.k);
  }, []);
  const zoomBy = useCallback((factor: number) => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom(graph.zoom() * factor, 220);
  }, []);
  const fitView = useCallback(() => graphRef.current?.zoomToFit(420, 60), []);
  const resetView = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom(1, 220);
    graph.centerAt(0, 0, 220);
    graph.d3ReheatSimulation();
  }, []);

  const nodeColor = useCallback(
    (node: NodeObject<PromptGraphNode>) => {
      if (activeNodeIds.size > 0 && !activeNodeIds.has(node.id)) {
        return theme.nodeDimmed;
      }
      if (node.id === selectedPromptId) {
        return theme.nodeSelected;
      }
      return nodeColorMap.get(node.id) ?? theme.nodeConnected;
    },
    [activeNodeIds, selectedPromptId, theme, nodeColorMap],
  );

  const paintNode = useCallback(
    (
      node: NodeObject<PromptGraphNode>,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const radius = Math.sqrt(getNodeVal(node)) * 3.2;
      const isSelected = node.id === selectedPromptId;
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 2.5, 0, Math.PI * 2);
        ctx.fillStyle = theme.nodeSelectedRing;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor(node);
      ctx.fill();

      if (node.isFavorite) {
        ctx.beginPath();
        ctx.arc(
          x + radius * 0.7,
          y - radius * 0.7,
          Math.max(2, radius * 0.35),
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#f5a623";
        ctx.fill();
      }

      const show = shouldShowNodeLabel(
        node,
        prompts.length,
        highlightedId,
        activeNodeIds,
        globalScale,
      );
      if (!show) {
        return;
      }
      const active = node.id === highlightedId || activeNodeIds.has(node.id);
      const fontSize = Math.min(
        (active ? 13 : 12) / globalScale,
        active ? 15 : 13,
      );
      const label =
        node.title.length > 28 ? `${node.title.slice(0, 27)}…` : node.title;
      ctx.font = `${active ? 600 : 500} ${fontSize}px -apple-system, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const ly = y + radius + 4 / globalScale;
      ctx.lineWidth = 3.5 / globalScale;
      ctx.strokeStyle = theme.labelHalo;
      ctx.lineJoin = "round";
      ctx.strokeText(label, x, ly);
      ctx.fillStyle = active ? theme.labelActive : theme.label;
      ctx.fillText(label, x, ly);
    },
    [activeNodeIds, highlightedId, nodeColor, prompts.length, selectedPromptId, theme],
  );

  const linkColor = useCallback(
    (graphLink: PromptGraphLink) => {
      const link = graphLink as PromptGraphLink & Partial<PromptGraphSuggestionLink>;
      const sourceId = linkEndpointId(link.source);
      const targetId = linkEndpointId(link.target);
      if (link.isSuggestion) {
        return suggestionEdgeVisual(link.reason ?? "similar_title").color;
      }
      const isSemantic = !link.isHierarchy && link.kind !== "grouped_under";
      if (
        highlightedId &&
        (sourceId === highlightedId || targetId === highlightedId)
      ) {
        return isSemantic
          ? semanticEdgeVisual(link.kind as PromptRelation["kind"], sourceId, highlightedId).color
          : theme.linkActive;
      }
      if (
        selectedPromptId &&
        (sourceId === selectedPromptId || targetId === selectedPromptId)
      ) {
        return isSemantic
          ? semanticEdgeVisual(link.kind as PromptRelation["kind"], sourceId, selectedPromptId).color
          : theme.linkSelected;
      }
      if (link.isHierarchy) {
        return theme.link;
      }
      const kindLabel =
        link.kind === "grouped_under"
          ? null
          : link.kind as PromptRelation["kind"];
      return kindLabel
        ? semanticEdgeVisual(kindLabel, sourceId, null).color
        : theme.link;
    },
    [highlightedId, selectedPromptId, theme],
  );

  const linkWidth = useCallback(
    (graphLink: PromptGraphLink) => {
      const link = graphLink as PromptGraphLink & Partial<PromptGraphSuggestionLink>;
      const sourceId = linkEndpointId(link.source);
      const targetId = linkEndpointId(link.target);
      const focused =
        highlightedId && (sourceId === highlightedId || targetId === highlightedId);
      return focused || link.isSuggestion ? 2 : 1;
    },
    [highlightedId],
  );

  const linkDash = useCallback((graphLink: PromptGraphLink) => {
    const link = graphLink as PromptGraphLink & Partial<PromptGraphSuggestionLink>;
    if (link.isSuggestion === true) {
      return [1, 3] as [number, number];
    }
    if (link.kind === "grouped_under") {
      return null;
    }
    return semanticEdgeVisual(link.kind as PromptRelation["kind"], linkEndpointId(link.source), null).dash;
  }, []);

  const linkArrow = useCallback((graphLink: PromptGraphLink) => {
    const link = graphLink as PromptGraphLink & Partial<PromptGraphSuggestionLink>;
    if (link.isHierarchy || link.isSuggestion === true || link.kind === "grouped_under") {
      return 0;
    }
    return semanticEdgeVisual(link.kind as PromptRelation["kind"], linkEndpointId(link.source), null).arrowLength;
  }, []);

  const hoverCardData = useMemo<HoverCardData | null>(() => {
    if (!hoveredId) {
      return null;
    }
    const node = baseGraph.nodes.find((n) => n.id === hoveredId);
    if (!node) {
      return null;
    }
    return {
      title: node.title,
      tags: node.tags ?? [],
      usageCount: node.usageCount ?? 0,
      folderName: node.folderId
        ? (folderNameById.get(node.folderId) ?? null)
        : null,
      isFavorite: node.isFavorite ?? false,
      promptType: node.promptType ?? "text",
      suggestedCount: candidateCountByFocus.get(node.id) ?? 0,
    };
  }, [hoveredId, baseGraph.nodes, folderNameById, candidateCountByFocus]);

  const commitSuggestion = useCallback(
    (link: PromptGraphSuggestionLink) => {
      const source = linkEndpointId(link.source);
      const target = linkEndpointId(link.target);
      void createRelation({ sourcePromptId: source, targetPromptId: target, kind: "related_to" });
    },
    [createRelation],
  );

  const handleNodeClick = useCallback(
    (node: NodeObject<PromptGraphNode>) => {
      if (node.id === selectedPromptId) {
        setFocusId((prev) => (prev === node.id ? null : node.id));
        onSelectPrompt(node.id);
        return;
      }
      onSelectPrompt(node.id);
    },
    [onSelectPrompt, selectedPromptId],
  );
  const handleNodeHover = useCallback(
    (node: NodeObject<PromptGraphNode> | null) =>
      setHoveredId(node?.id ?? null),
    [],
  );
  const handleLinkClick = useCallback(
    (link: LinkObject<PromptGraphNode, PromptGraphLink>) => {
      const maybe = link as PromptGraphLink & Partial<PromptGraphSuggestionLink>;
      if (maybe.isSuggestion) {
        commitSuggestion(maybe as PromptGraphSuggestionLink);
      }
    },
    [commitSuggestion],
  );

  const zoomPercent = `${Math.round(zoomLevel * 100)}%`;

  if (graphData.nodes.length === 0) {
    return (
      <div
        className="flex h-full min-h-0 flex-col"
        style={{ backgroundColor: theme.background }}
      >
        <div className="flex h-full items-center justify-center px-6 text-sm text-muted-foreground">
          {t("prompt.graph.empty")}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full min-h-0 flex-col"
      style={{ backgroundColor: theme.background }}
    >
      <h2 className="sr-only">{t("prompt.graph.title")}</h2>
      <div
        ref={containerRef}
        className="relative min-h-[420px] flex-1 overflow-hidden"
        data-testid="prompt-graph-content"
      >
        <ForceGraph2D<PromptGraphNode, PromptGraphLink>
          ref={graphRef}
          width={size.width || 800}
          height={size.height || 600}
          graphData={renderedGraphData}
          backgroundColor={theme.background}
          nodeId="id"
          nodeVal={getNodeVal}
          nodeColor={nodeColor}
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => "replace"}
          nodeLabel={() => ""}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkLineDash={linkDash}
          linkDirectionalArrowLength={linkArrow}
          linkDirectionalArrowRelPos={1}
          onLinkClick={handleLinkClick}
          warmupTicks={motionConfig.warmupTicks}
          cooldownTicks={motionConfig.cooldownTicks}
          d3AlphaDecay={motionConfig.alphaDecay}
          d3VelocityDecay={0.32}
          enableNodeDrag
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onZoom={handleZoom}
        />
        <GraphLegend mode={colorMode} t={t} expanded={legendOpen} />
        <NodeHoverCard data={hoverCardData} t={t} />
        <GraphControls
          zoomPercent={zoomPercent}
          t={t}
          isDarkMode={isDarkMode}
          legendOpen={legendOpen}
          onZoomIn={() => zoomBy(ZOOM_STEP)}
          onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
          onFit={fitView}
          onReset={resetView}
          onToggleLegend={() => setLegendOpen((c) => !c)}
        />
        <GraphFilterBar
          t={t}
          availableTags={availableTags}
          selectedTags={selectedTags}
          folderOptions={rootFolderOptions}
          selectedFolderIds={selectedFolderIds}
          focusActive={focusId !== null}
          isolatedCount={isolatedCount}
          onToggleTag={(tag) =>
            setSelectedTags((s) =>
              s.includes(tag) ? s.filter((x) => x !== tag) : [...s, tag],
            )
          }
          onToggleFolder={(id) =>
            setSelectedFolderIds((s) =>
              s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
            )
          }
          onClearFilters={() => {
            setSelectedTags([]);
            setSelectedFolderIds([]);
          }}
          onExitFocus={() => setFocusId(null)}
        />
      </div>
    </div>
  );
}

function linkEndpointId(endpoint: string | PromptGraphNode): string {
  return typeof endpoint === "string" ? endpoint : endpoint.id;
}
