import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SituationPlanActionControls } from "../ui/situation/SituationPlanActionControls";

afterEach(cleanup);

describe("SituationPlanActionControls", () => {
  it("routes each action through its injected canvas command", () => {
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const onSendBackward = vi.fn();
    const onBringForward = vi.fn();
    render(
      <SituationPlanActionControls
        onDelete={onDelete}
        onEdit={onEdit}
        onSendBackward={onSendBackward}
        onBringForward={onBringForward}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Verwijder" }));
    fireEvent.click(screen.getByRole("button", { name: "Bewerk" }));
    fireEvent.click(screen.getByRole("button", { name: "Naar achter" }));
    fireEvent.click(screen.getByRole("button", { name: "Naar voor" }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onSendBackward).toHaveBeenCalledOnce();
    expect(onBringForward).toHaveBeenCalledOnce();
  });

  it("hides legacy action widgets when the ribbon regenerates", async () => {
    const ribbon = document.createElement("div");
    ribbon.id = "ribbon";
    document.body.append(ribbon);
    render(
      <SituationPlanActionControls
        onDelete={() => {}}
        onEdit={() => {}}
        onSendBackward={() => {}}
        onBringForward={() => {}}
      />,
    );

    ribbon.innerHTML = `
      <div id="button_Delete"></div>
      <div id="button_edit"></div>
      <div id="sendBack"></div>
      <div id="bringFront"></div>
    `;

    await waitFor(() => {
      expect(ribbon.querySelectorAll(".hidden")).toHaveLength(4);
    });
    ribbon.remove();
  });
});
