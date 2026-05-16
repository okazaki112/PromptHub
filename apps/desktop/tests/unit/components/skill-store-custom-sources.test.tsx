import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SkillStore } from "../../../src/renderer/components/skill/SkillStore";
import { useSkillStore } from "../../../src/renderer/stores/skill.store";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";

const { showToast } = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("../../../src/renderer/components/ui/Toast", () => ({
  useToast: () => ({ showToast }),
}));

describe("SkillStore custom sources", () => {
  beforeEach(() => {
    useSkillStore.setState({
      skills: [],
      selectedSkillId: null,
      isLoading: false,
      error: null,
      viewMode: "gallery",
      searchQuery: "",
      filterType: "all",
      filterTags: [],
      deployedSkillNames: new Set<string>(),
      storeView: "store",
      registrySkills: [],
      isLoadingRegistry: false,
      storeCategory: "all",
      storeSearchQuery: "",
      selectedRegistrySlug: null,
      customStoreSources: [],
      selectedStoreSourceId: "official",
      remoteStoreEntries: {},
      translationCache: {},
    });
  });

  it("edits a custom store source from the header action modal", async () => {
    installWindowMocks({
      api: {
        skill: {
          fetchRemoteContent: vi.fn().mockResolvedValue(JSON.stringify({ skills: [] })),
          scanLocalPreview: vi.fn().mockResolvedValue([]),
          scanSafety: vi.fn().mockResolvedValue({
            level: "safe",
            summary: "safe",
            findings: [],
            recommendedAction: "allow",
            scannedAt: Date.now(),
            checkedFileCount: 1,
            scanMethod: "ai",
          }),
        },
      },
    });

    useSkillStore.setState({
      storeView: "store",
      customStoreSources: [
        {
          id: "custom-docs",
          name: "Docs Store",
          type: "marketplace-json",
          url: "https://example.com/store.json",
          enabled: true,
          order: 0,
          createdAt: Date.now(),
        },
      ],
      selectedStoreSourceId: "custom-docs",
    } as never);

    await act(async () => {
      await renderWithI18n(<SkillStore />, { language: "en" });
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const input = screen.getByDisplayValue("Docs Store");
    fireEvent.change(input, { target: { value: "Docs Store Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(useSkillStore.getState().customStoreSources[0]?.name).toBe(
        "Docs Store Renamed",
      );
    });

    expect(screen.getAllByText("Docs Store Renamed").length).toBeGreaterThan(0);
  });

  it("does not render duplicate custom store action cards in the main pane", async () => {
    installWindowMocks({
      api: {
        skill: {
          fetchRemoteContent: vi.fn().mockResolvedValue(JSON.stringify({ skills: [] })),
          scanLocalPreview: vi.fn().mockResolvedValue([]),
          scanSafety: vi.fn().mockResolvedValue({
            level: "safe",
            summary: "safe",
            findings: [],
            recommendedAction: "allow",
            scannedAt: Date.now(),
            checkedFileCount: 1,
            scanMethod: "ai",
          }),
        },
      },
    });

    useSkillStore.setState({
      storeView: "store",
      customStoreSources: [
        {
          id: "custom-docs",
          name: "Docs Store",
          type: "marketplace-json",
          url: "https://example.com/store.json",
          enabled: true,
          order: 0,
          createdAt: Date.now(),
        },
      ],
      selectedStoreSourceId: "custom-docs",
    } as never);

    await act(async () => {
      await renderWithI18n(<SkillStore />, { language: "en" });
    });

    expect(screen.queryByRole("button", { name: "Disable" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByText("Enabled")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByText("No skills in this custom store yet")).toBeInTheDocument();
    expect(screen.queryAllByText("Docs Store")).toHaveLength(1);
    expect(screen.queryByPlaceholderText("Search skills...")).not.toBeInTheDocument();
  });

  it("renders the empty search state without crashing", async () => {
    installWindowMocks({
      api: {
        skill: {
          fetchRemoteContent: vi.fn().mockResolvedValue(JSON.stringify({ skills: [] })),
          scanLocalPreview: vi.fn().mockResolvedValue([]),
          scanSafety: vi.fn().mockResolvedValue({
            level: "safe",
            summary: "safe",
            findings: [],
            recommendedAction: "allow",
            scannedAt: Date.now(),
            checkedFileCount: 1,
            scanMethod: "ai",
          }),
        },
      },
    });

    useSkillStore.setState({
      storeView: "store",
      selectedStoreSourceId: "official",
      storeSearchQuery: "missing",
      registrySkills: [
        {
          slug: "writer-skill",
          name: "Writer Skill",
          description: "Write better",
          category: "office",
          author: "PromptHub",
          source_url: "https://example.com/writer-skill",
          tags: ["writer"],
          version: "1.0.0",
          content: "# Writer Skill",
        },
      ],
    } as never);

    await act(async () => {
      await renderWithI18n(<SkillStore />, { language: "en" });
    });

    expect(screen.getByText("No skills found")).toBeInTheDocument();
    expect(
      screen.getByText("Try a different search or category"),
    ).toBeInTheDocument();
  });
});
