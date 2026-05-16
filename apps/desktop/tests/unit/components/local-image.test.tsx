import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocalImage } from "../../../src/renderer/components/ui/LocalImage";

vi.mock("../../../src/renderer/utils/media-url", () => ({
  resolveLocalImageSrc: (src: string) => `resolved://${src}`,
}));

describe("LocalImage", () => {
  it("recovers from a previous load failure when the src changes", async () => {
    const { rerender } = render(<LocalImage src="broken.png" alt="Preview" />);

    fireEvent.error(screen.getByAltText("Preview"));
    expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();

    rerender(<LocalImage src="fixed.png" alt="Preview" />);

    await waitFor(() => {
      expect(screen.getByAltText("Preview")).toHaveAttribute(
        "src",
        "resolved://fixed.png",
      );
    });
  });
});
