import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SituationPlanZoomControls } from "../ui/situation/SituationPlanZoomControls";

afterEach(cleanup);

describe("SituationPlanZoomControls", () => {
  it("routes each zoom action through its injected canvas command", () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onZoomToFit = vi.fn();
    render(
      <SituationPlanZoomControls
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomToFit={onZoomToFit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Inzoomen" }));
    fireEvent.click(screen.getByRole("button", { name: "Uitzoomen" }));
    fireEvent.click(screen.getByRole("button", { name: "Schermvullend" }));

    expect(onZoomIn).toHaveBeenCalledOnce();
    expect(onZoomOut).toHaveBeenCalledOnce();
    expect(onZoomToFit).toHaveBeenCalledOnce();
  });
});
