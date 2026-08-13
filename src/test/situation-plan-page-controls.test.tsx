import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LegacySituationPlanStore } from "../application/LegacySituationPlanStore";
import { SituationPlanPageControls } from "../ui/situation/SituationPlanPageControls";
import { loadFixture } from "./helpers";

beforeEach(() => {
  globalThis.SITPLANVIEW_DEFAULT_SCALE = 1;
});

afterEach(() => {
  cleanup();
  delete (globalThis as { structure?: unknown }).structure;
});

function createStore() {
  const structure = loadFixture("example001.eds");
  globalThis.structure = structure;
  return new LegacySituationPlanStore(structure);
}

describe("SituationPlanPageControls", () => {
  it("adds pages and only enables adding from the last page", () => {
    const store = createStore();
    const onMutation = vi.fn();
    render(<SituationPlanPageControls store={store} onMutation={onMutation} />);

    fireEvent.click(screen.getByRole("button", { name: "Nieuw" }));
    expect(screen.getByRole("combobox", { name: "Pagina" })).toHaveValue("2");
    expect(screen.getAllByRole("option")).toHaveLength(2);

    fireEvent.change(screen.getByRole("combobox", { name: "Pagina" }), {
      target: { value: "1" },
    });
    expect(screen.getByRole("button", { name: "Nieuw" })).toBeDisabled();
    expect(onMutation).toHaveBeenNthCalledWith(1);
    expect(onMutation).toHaveBeenNthCalledWith(2, "changePage");
  });

  it("confirms page deletion and publishes the resulting state", () => {
    const store = createStore();
    store.commands.addPage();
    const confirmDelete = vi.fn(() => true);
    const onMutation = vi.fn();
    render(
      <SituationPlanPageControls
        store={store}
        confirmDelete={confirmDelete}
        onMutation={onMutation}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pagina 2 verwijderen" }));

    expect(confirmDelete).toHaveBeenCalledWith(2);
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Pagina 1 verwijderen" })).toBeDisabled();
    expect(onMutation).toHaveBeenCalledOnce();
  });
});
