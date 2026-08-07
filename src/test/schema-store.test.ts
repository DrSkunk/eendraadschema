// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { LegacySchemaStore } from "../application/LegacySchemaStore";
import { SchemaCommandError } from "../application/SchemaStore";
import { Hierarchical_List } from "../Hierarchical_List";

function createStore() {
  const structure = new Hierarchical_List();
  const board = structure.addItem("Bord");
  board.props.naam = "Hoofdbord";
  return { store: new LegacySchemaStore(structure), boardId: board.id };
}

function expectCommandError(action: () => void, code: string) {
  try {
    action();
    throw new Error("Expected SchemaCommandError");
  } catch (error) {
    expect(error).toBeInstanceOf(SchemaCommandError);
    expect((error as SchemaCommandError).code).toBe(code);
  }
}

describe("LegacySchemaStore", () => {
  it("adds items through commands and publishes stable external-store snapshots", () => {
    const { store, boardId } = createStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const before = store.getSnapshot();

    const circuitId = store.commands.addItem(boardId, "Kring");
    const after = store.getSnapshot();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(after);
    expect(after).not.toBe(before);
    expect(after.revision).toBe(1);
    expect(after.canUndo).toBe(true);
    expect(after.document.getItem(circuitId)?.type).toBe("Kring");
    expect(after.document.getItem(circuitId)?.parentId).toBe(boardId);

    unsubscribe();
    store.commands.addItem(circuitId, "Contactdoos");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("updates properties and changes type through the legacy domain factory", () => {
    const { store, boardId } = createStore();
    const circuitId = store.commands.addItem(boardId, "Kring");
    const itemId = store.commands.addItem(circuitId, "Contactdoos");

    store.commands.updateItem(itemId, { aantal: "3", adres: "Garage" });
    expect(store.getSnapshot().document.getItem(itemId)?.summary.address).toBe("Garage");
    expect(store.getLegacyDocument().getElectroItemById(itemId)?.props.aantal).toBe("3");

    store.commands.updateItem(itemId, { type: "Lichtpunt" });
    expect(store.getSnapshot().document.getItem(itemId)?.type).toBe("Lichtpunt");
    expect(store.getSnapshot().document.getItem(itemId)?.parentId).toBe(circuitId);
  });

  it("exposes typed circuit properties without leaking legacy property keys", () => {
    const { store, boardId } = createStore();
    const circuitId = store.commands.addItem(boardId, "Kring");
    store.commands.updateItem(circuitId, {
      autoKringNaam: "manueel",
      naam: "Garage",
      bescherming: "differentieelautomaat",
      differentieel_delta_amperage: "30",
      kabel_is_aanwezig: true,
      type_kabel: "XVB Cca 5G6",
    });

    expect(store.getSnapshot().properties.getCircuit(circuitId)).toMatchObject({
      itemId: circuitId,
      nameMode: "manueel",
      name: "Garage",
      protection: "differentieelautomaat",
      differentialCurrent: "30",
      hasCable: true,
      cableType: "XVB Cca 5G6",
    });
    expect(store.getSnapshot().properties.getCircuit(boardId)).toBeUndefined();
  });

  it("deletes a subtree and restores it through undo and redo", () => {
    const { store, boardId } = createStore();
    const circuitId = store.commands.addItem(boardId, "Kring");
    const itemId = store.commands.addItem(circuitId, "Contactdoos");
    store.commands.deleteItem(circuitId);

    expect(store.getSnapshot().document.getItem(circuitId)).toBeUndefined();
    expect(store.getSnapshot().document.getItem(itemId)).toBeUndefined();

    store.commands.undo();
    expect(store.getSnapshot().document.getItem(circuitId)?.type).toBe("Kring");
    expect(store.getSnapshot().document.getItem(itemId)?.parentId).toBe(circuitId);
    expect(store.getSnapshot().canRedo).toBe(true);

    store.commands.redo();
    expect(store.getSnapshot().document.getItem(circuitId)).toBeUndefined();
    expect(store.getSnapshot().canRedo).toBe(false);
  });

  it("clears redo history after a new command", () => {
    const { store, boardId } = createStore();
    store.commands.addItem(boardId, "Kring");
    store.commands.undo();
    expect(store.getSnapshot().canRedo).toBe(true);

    store.commands.addItem(boardId, "Kring");
    expect(store.getSnapshot().canRedo).toBe(false);
  });

  it("duplicates an entire subtree with new IDs", () => {
    const { store, boardId } = createStore();
    const circuitId = store.commands.addItem(boardId, "Kring");
    const socketId = store.commands.addItem(circuitId, "Contactdoos");
    store.commands.addItem(socketId, "Verbruiker");

    const duplicateId = store.commands.duplicateItem(socketId);
    const duplicate = store.getSnapshot().document.getItem(duplicateId)!;

    expect(duplicate.type).toBe("Contactdoos");
    expect(duplicate.parentId).toBe(circuitId);
    expect(duplicate.childIds).toHaveLength(1);
    expect(duplicate.childIds[0]).not.toBe(socketId);
    expect(store.getSnapshot().document.getItem(duplicate.childIds[0])?.type).toBe("Verbruiker");
  });

  it("moves items between parents and to a requested sibling position", () => {
    const { store, boardId } = createStore();
    const firstCircuit = store.commands.addItem(boardId, "Kring");
    const secondCircuit = store.commands.addItem(boardId, "Kring");
    const firstItem = store.commands.addItem(firstCircuit, "Contactdoos");
    const secondItem = store.commands.addItem(firstCircuit, "Lichtpunt");

    store.commands.moveItem(secondItem, { targetParentId: firstCircuit, position: 0 });
    expect(store.getSnapshot().document.getItem(firstCircuit)?.childIds).toEqual([secondItem, firstItem]);

    store.commands.moveItem(firstItem, { targetParentId: secondCircuit });
    expect(store.getSnapshot().document.getItem(firstItem)?.parentId).toBe(secondCircuit);
    expect(store.getSnapshot().document.getItem(firstCircuit)?.childIds).toEqual([secondItem]);
  });

  it("rejects missing items, invalid child types, cycles, and full parents", () => {
    const { store, boardId } = createStore();
    const circuitId = store.commands.addItem(boardId, "Kring");
    const socketId = store.commands.addItem(circuitId, "Contactdoos");
    const consumerId = store.commands.addItem(socketId, "Verbruiker");

    expectCommandError(() => store.commands.deleteItem(999_999), "ITEM_NOT_FOUND");
    expectCommandError(() => store.commands.addItem(boardId, "Contactdoos"), "INVALID_CHILD_TYPE");
    expectCommandError(
      () => store.commands.moveItem(circuitId, { targetParentId: consumerId }),
      "CYCLIC_PARENT",
    );
    expectCommandError(() => store.commands.addItem(socketId, "Verbruiker"), "MAX_CHILDREN_REACHED");
    expectCommandError(
      () => store.commands.moveItem(consumerId, { targetParentId: circuitId, position: -1 }),
      "INVALID_POSITION",
    );
  });

  it("does not publish or create history entries when validation fails", () => {
    const { store, boardId } = createStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();

    expectCommandError(() => store.commands.addItem(boardId, "Onbekend"), "INVALID_CHILD_TYPE");

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(before);
    expect(store.getSnapshot().canUndo).toBe(false);
  });

  it("rolls the complete document back when normalization fails", () => {
    const { store, boardId } = createStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();
    const originalRenumber = store.getLegacyDocument().reNumber;
    store.getLegacyDocument().reNumber = () => {
      throw new Error("normalization failed");
    };

    expect(() => store.commands.addItem(boardId, "Kring")).toThrow("normalization failed");

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot().revision).toBe(before.revision);
    expect(store.getSnapshot().document.getItem(boardId)?.childIds).toEqual([]);
    expect(store.getSnapshot().canUndo).toBe(false);

    // The failed working document was disposed and replaced by its snapshot.
    expect(store.getLegacyDocument().reNumber).toBe(originalRenumber);
  });

  it("replaces an imported document explicitly and starts a fresh history", () => {
    const { store, boardId } = createStore();
    store.commands.addItem(boardId, "Kring");
    expect(store.getSnapshot().canUndo).toBe(true);

    const imported = new Hierarchical_List();
    const importedBoard = imported.addItem("Bord");
    importedBoard.props.naam = "Garage";
    const listener = vi.fn();
    store.subscribe(listener);

    store.commands.replaceDocument(imported.toJsonObject(false));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().document.getAllItems()).toHaveLength(1);
    expect(store.getSnapshot().document.getItem(importedBoard.id)?.summary.name).toBe("Garage");
    expect(store.getSnapshot().canUndo).toBe(false);
    expect(store.getSnapshot().canRedo).toBe(false);
  });

  it("refreshes subscribers after a legacy mutation without claiming its undo history", () => {
    const { store, boardId } = createStore();
    const listener = vi.fn();
    store.subscribe(listener);

    const legacyCircuit = store.getLegacyDocument().createItem("Kring");
    store.getLegacyDocument().insertChildAfterId(legacyCircuit, boardId);
    store.synchronizeLegacyDocument(store.getLegacyDocument());

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().document.getItem(legacyCircuit.id)?.parentId).toBe(boardId);
    expect(store.getSnapshot().canUndo).toBe(false);

    store.synchronizeLegacyDocument(store.getLegacyDocument());
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("adopts a document replaced by legacy import code", () => {
    const { store } = createStore();
    const imported = new Hierarchical_List();
    const importedBoard = imported.addItem("Bord");
    importedBoard.props.naam = "Werkplaats";

    store.synchronizeLegacyDocument(imported);

    expect(store.getLegacyDocument()).toBe(imported);
    expect(store.getSnapshot().document.getItem(importedBoard.id)?.summary.name).toBe("Werkplaats");
    expect(store.getSnapshot().canUndo).toBe(false);
  });
});
