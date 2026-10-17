import type { Prompt } from "@prompthub/shared/types";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptHeatmapView } from "../../../src/renderer/components/prompt/PromptHeatmapView";
import { renderWithI18n } from "../../helpers/i18n";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function localKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function heatmapPrompt(id: string, title: string, created: Date, usageCount: number): Prompt {
  const iso = created.toISOString();
  return {
    id,
    title,
    userPrompt: `${id} body`,
    variables: [],
    tags: [],
    isFavorite: false,
    isPinned: false,
    version: 1,
    currentVersion: 1,
    usageCount,
    createdAt: iso,
    updatedAt: iso,
  } as unknown as Prompt;
}

async function renderHeatmap(prompts: Prompt[]) {
  return renderWithI18n(
    <PromptHeatmapView
      prompts={prompts}
      selectedPromptId={null}
      onSelectPrompt={() => undefined}
      onViewDetail={() => undefined}
    />,
    {
      language: "en",
    },
  );
}

describe("PromptHeatmapView", () => {
  it("shows an empty state with no prompts", async () => {
    await renderHeatmap([]);
    expect(
      await screen.findByText(/No prompts to visualize/i),
    ).toBeInTheDocument();
  });

  it("selects a cell, renders tooltip hover data, and clears with Escape", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const prompts = [
      heatmapPrompt("heat-1", "Yesterday Heat Prompt", yesterday, 14),
    ];
    await renderHeatmap(prompts);

    const dateKey = localKey(yesterday);
    const cell = await waitFor(() => {
      const found = document.querySelector<HTMLButtonElement>(
        `[data-date-key="${dateKey}"]`,
      );
      expect(found).not.toBeNull();
      return found as HTMLButtonElement;
    });

    fireEvent.mouseEnter(cell);
    const tooltip = await screen.findByTestId("prompt-heatmap-tooltip");
    expect(within(tooltip).getByText(/Yesterday Heat Prompt/)).toBeInTheDocument();

    fireEvent.click(cell);
    const panel = await waitFor(() =>
      screen.getByTestId("prompt-heatmap-selection-panel"),
    );
    expect(
      within(panel).getByText("Yesterday Heat Prompt", { exact: false }),
    ).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("grid"), { key: "Escape" });
    expect(
      await screen.findByText(/Click a (day|date) to inspect/i),
    ).toBeInTheDocument();
  });

  it("switches the heatmap metric from header controls", async () => {
    const today = new Date();
    const prompts = [heatmapPrompt("today-one", "Today Prompt", today, 9)];
    await renderHeatmap(prompts);

    fireEvent.click(screen.getByRole("button", { name: "Current usage heat" }));

    const dateKey = localKey(today);
    const cell = await waitFor(() => {
      const found = document.querySelector<HTMLButtonElement>(
        `[data-heatmap-cell][data-date-key="${dateKey}"]`,
      );
      expect(found).not.toBeNull();
      return found as HTMLButtonElement;
    });
    expect(cell.disabled).toBe(false);
  });
});

