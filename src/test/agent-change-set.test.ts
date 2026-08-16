import { describe, expect, it, beforeEach } from "vitest";
import { LegacySchemaStore } from "../application/LegacySchemaStore";
import { loadFixture } from "./helpers";

beforeEach(() => {
  globalThis.SITPLANVIEW_DEFAULT_SCALE = 1;
});

describe("reviewed agent change sets", () => {
  it("stages and records several valid mutations as one undoable revision", () => {
    const structure = loadFixture("example001.eds");
    const store = new LegacySchemaStore(structure);
    const circuit = store.getSnapshot().document.getAllItems().find(item => item.type === "Kring")!;
    const before = store.getSnapshot().document.getAllItems().length;

    store.commands.applyAgentChangeSet([
      { kind: "add-item", parentId: circuit.id, type: "Contactdoos" },
      { kind: "add-item", parentId: circuit.id, type: "Lichtpunt" },
    ]);

    expect(store.getSnapshot().document.getAllItems()).toHaveLength(before + 2);
    expect(store.getSnapshot().canUndo).toBe(true);
    store.commands.undo();
    expect(store.getSnapshot().document.getAllItems()).toHaveLength(before);
  });

  it("leaves the live document untouched when any staged operation is invalid", () => {
    const structure = loadFixture("example001.eds");
    const store = new LegacySchemaStore(structure);
    const before = store.getSnapshot().revision;

    expect(() => store.commands.applyAgentChangeSet([
      { kind: "add-item", parentId: null, type: "Contactdoos" },
    ])).toThrow(/niet toegestaan/);
    expect(store.getSnapshot().revision).toBe(before);
  });
});
