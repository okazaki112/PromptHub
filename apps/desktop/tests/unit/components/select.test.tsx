import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Select } from "../../../src/renderer/components/ui/Select";
import { renderWithI18n } from "../../helpers/i18n";

describe("Select", () => {
  it("renders dropdown in a portal attached to document.body", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    await renderWithI18n(
      <div style={{ overflow: "hidden", height: 80 }}>
        <Select
          value=""
          onChange={onChange}
          placeholder="Choose folder"
          options={[
            { value: "", label: "AI Smart Folder" },
            { value: "folder-1", label: "Marketing" },
          ]}
        />
      </div>,
      { language: "en" },
    );

    await user.click(screen.getByRole("button", { name: /AI Smart Folder/i }));

    const option = await screen.findByText("Marketing");
    expect(option).toBeInTheDocument();
    expect(option.closest("[style='overflow: hidden; height: 80px;']")).toBeNull();

    await user.click(option);

    expect(onChange).toHaveBeenCalledWith("folder-1");
  });
});
