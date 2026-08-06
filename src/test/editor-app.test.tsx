import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LegacySchemaStore } from "../application/LegacySchemaStore";
import { Hierarchical_List } from "../Hierarchical_List";
import { EditorApp } from "../ui/App";
import { reactEditorShellEnabled } from "../ui/featureFlags";

afterEach(cleanup);

function createStore() {
  const structure = new Hierarchical_List();
  const board = structure.addItem("Bord");
  return { store: new LegacySchemaStore(structure), boardId: board.id };
}

describe("EditorApp", () => {
  it("renders an accessible Dutch editor shell from the schema store", () => {
    const { store } = createStore();
    render(<EditorApp schemaStore={store} />);

    expect(screen.getByRole("banner")).toHaveTextContent("Eéndraadschema");
    expect(screen.getByRole("status")).toHaveTextContent("1 elektrisch onderdeel");
  });

  it("updates when a schema command publishes a new snapshot", () => {
    const { store, boardId } = createStore();
    render(<EditorApp schemaStore={store} />);

    act(() => {
      store.commands.addItem(boardId, "Kring");
    });

    expect(screen.getByRole("status")).toHaveTextContent("2 elektrische onderdelen");
  });

  it("allows the React shell to be disabled for legacy fallback", () => {
    expect(reactEditorShellEnabled("")).toBe(true);
    expect(reactEditorShellEnabled("?reactShell=off")).toBe(false);
  });
});
