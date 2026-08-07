import { Hierarchical_List } from "../Hierarchical_List";
import { Electro_Item } from "../List_Item/Electro_Item";
import { structureFromJson } from "../legacy/persistence/EdsCodec";
import { DocumentSnapshotHistory } from "./DocumentSnapshotHistory";
import { validateAndMapCircuitChanges } from "./CircuitPropertyValidation";
import { validateAndMapSocketChanges } from "./SocketPropertyValidation";
import {
  basicConsumerTypes,
  validateAndMapBasicConsumerChanges,
} from "./BasicConsumerPropertyValidation";
import { validateAndMapLightPointChanges } from "./LightPointPropertyValidation";
import { configuredItemTypes, type ConfiguredItemPropertyChanges } from "./ConfiguredItemProperties";
import { validateAndMapConfiguredItemChanges } from "./ConfiguredItemPropertyValidation";
import { LegacySchemaDocumentReader } from "./LegacySchemaDocumentReader";
import { LegacySchemaPropertyReader } from "./LegacySchemaPropertyReader";
import type {
  BasicConsumerPropertyChanges,
  CircuitPropertyChanges,
  SocketPropertyChanges,
  LightPointPropertyChanges,
} from "./SchemaPropertyReader";
import {
  SchemaCommandError,
  type MoveItemOptions,
  type SchemaCommands,
  type SchemaSnapshot,
  type SchemaStore,
} from "./SchemaStore";

const BLOCKED_CHANGE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export class LegacySchemaStore implements SchemaStore {
  private structure: Hierarchical_List;
  private readonly listeners = new Set<() => void>();
  private readonly history: DocumentSnapshotHistory;
  private serializedSnapshot: string;
  private revision = 0;
  private snapshot: SchemaSnapshot;

  readonly commands: SchemaCommands;

  constructor(structure: Hierarchical_List, maxHistorySteps: number = 100) {
    this.structure = structure;
    this.serializedSnapshot = this.serialize();
    this.history = new DocumentSnapshotHistory(this.serializedSnapshot, maxHistorySteps);
    this.snapshot = this.createSnapshot();
    this.commands = Object.freeze({
      addItem: this.addItem.bind(this),
      deleteItem: this.deleteItem.bind(this),
      moveItem: this.moveItem.bind(this),
      changeItemType: this.changeItemType.bind(this),
      updateItem: this.updateItem.bind(this),
      updateCircuit: this.updateCircuit.bind(this),
      updateSocket: this.updateSocket.bind(this),
      updateBasicConsumer: this.updateBasicConsumer.bind(this),
      updateLightPoint: this.updateLightPoint.bind(this),
      updateConfiguredItem: this.updateConfiguredItem.bind(this),
      duplicateItem: this.duplicateItem.bind(this),
      expandItem: this.expandItem.bind(this),
      replaceDocument: this.replaceDocument.bind(this),
      undo: this.undo.bind(this),
      redo: this.redo.bind(this),
    });
  }

  getSnapshot(): SchemaSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Legacy integration seam for SVG, persistence, and print adapters. */
  getLegacyDocument(): Hierarchical_List {
    return this.structure;
  }

  /**
   * Transitional seam for legacy handlers that still mutate or replace the
   * authoritative document outside SchemaCommands. It refreshes subscribers
   * but deliberately starts a fresh command history: the store must never
   * claim it can undo a mutation that belongs to the legacy undo controller.
   */
  synchronizeLegacyDocument(structure: Hierarchical_List): void {
    const serialized = structure.toJsonObject(false);
    if (structure === this.structure && serialized === this.serializedSnapshot) return;

    this.structure = structure;
    this.serializedSnapshot = serialized;
    this.history.reset(serialized);
    this.publish();
  }

  private addItem(parentId: number | null, type: string): number {
    const parent = this.getParent(parentId);
    this.assertChildAllowed(parent, type);
    this.assertParentCapacity(parent);

    return this.commitTransaction(() => {
      let item: Electro_Item;
      if (parent === null) {
        item = this.structure.addItem(type);
      } else {
        const placeholder = this.structure.createItem("");
        this.structure.insertChildAfterId(placeholder, parent.id);
        this.structure.adjustTypeById(placeholder.id, type);
        item = this.requireItem(placeholder.id);
      }
      return item.id;
    });
  }

  private deleteItem(itemId: number): void {
    this.assertUserEditable(this.requireItem(itemId));
    this.commitTransaction(() => this.structure.deleteById(itemId));
  }

  private moveItem(itemId: number, options: MoveItemOptions): void {
    const item = this.requireItem(itemId);
    this.assertUserEditable(item);

    if (options.position !== undefined && (!Number.isInteger(options.position) || options.position < 0)) {
      throw new SchemaCommandError("INVALID_POSITION", "De doelpositie moet een positief geheel getal zijn.");
    }

    const targetParent = this.getParent(options.targetParentId);
    if (targetParent?.id === item.id) {
      throw new SchemaCommandError("CYCLIC_PARENT", "Een item kan niet zijn eigen ouder worden.");
    }
    this.assertNoCycle(item.id, targetParent);
    this.assertChildAllowed(targetParent, item.getType());

    const legacyTargetParentId = targetParent?.id ?? 0;
    if (item.parent !== legacyTargetParentId) this.assertParentCapacity(targetParent);

    this.commitTransaction(() => {
      item.parent = legacyTargetParentId;
      this.structure.reSort();
      this.moveToSiblingPosition(item.id, options.position);
    });
  }

  private updateItem(itemId: number, changes: Readonly<Record<string, unknown>>): void {
    let item = this.requireItem(itemId);
    this.assertUserEditable(item);
    for (const key of Object.keys(changes)) {
      if (BLOCKED_CHANGE_KEYS.has(key)) {
        throw new SchemaCommandError("INVALID_CHANGE", `Eigenschap '${key}' kan niet worden aangepast.`);
      }
    }

    const hasTypeChange = Object.prototype.hasOwnProperty.call(changes, "type");
    const changedType = hasTypeChange
      ? changes.type
      : undefined;
    if (hasTypeChange) {
      if (typeof changedType !== "string") {
        throw new SchemaCommandError("INVALID_CHANGE", "Het itemtype moet tekst zijn.");
      }
      const parent = this.getParent(item.parent === 0 ? null : item.parent);
      this.assertChildAllowed(parent, changedType);
    }

    this.commitTransaction(() => {
      if (typeof changedType === "string" && changedType !== item.getType()) {
        this.structure.adjustTypeById(itemId, changedType);
        item = this.requireItem(itemId);
      }
      for (const [key, value] of Object.entries(changes)) {
        if (key !== "type") item.props[key] = value;
      }
      item.normalizeProperties();
    });
  }

  private changeItemType(itemId: number, type: string): void {
    if (type.trim() === "") {
      throw new SchemaCommandError("INVALID_CHANGE", "Het itemtype mag niet leeg zijn.");
    }
    this.updateItem(itemId, { type });
  }

  private updateCircuit(itemId: number, changes: Readonly<CircuitPropertyChanges>): void {
    const item = this.requireItem(itemId);
    if (item.getType() !== "Kring") {
      throw new SchemaCommandError("INVALID_CHANGE", `Item ${itemId} is geen kring.`);
    }

    const legacyChanges = validateAndMapCircuitChanges(changes);
    if (Object.keys(legacyChanges).length === 0) return;
    this.updateItem(itemId, legacyChanges);
  }

  private updateSocket(itemId: number, changes: Readonly<SocketPropertyChanges>): void {
    const item = this.requireItem(itemId);
    if (item.getType() !== "Contactdoos") {
      throw new SchemaCommandError("INVALID_CHANGE", `Item ${itemId} is geen contactdoos.`);
    }

    const legacyChanges = validateAndMapSocketChanges(changes);
    if (Object.keys(legacyChanges).length === 0) return;
    this.updateItem(itemId, legacyChanges);
  }

  private updateBasicConsumer(
    itemId: number,
    changes: Readonly<BasicConsumerPropertyChanges>,
  ): void {
    const item = this.requireItem(itemId);
    if (!basicConsumerTypes.has(item.getType())) {
      throw new SchemaCommandError("INVALID_CHANGE", `Item ${itemId} gebruikt geen basiseigenschappen.`);
    }
    const legacyChanges = validateAndMapBasicConsumerChanges(changes);
    if (Object.keys(legacyChanges).length === 0) return;
    this.updateItem(itemId, legacyChanges);
  }

  private updateLightPoint(itemId: number, changes: Readonly<LightPointPropertyChanges>): void {
    const item = this.requireItem(itemId);
    if (item.getType() !== "Lichtpunt") {
      throw new SchemaCommandError("INVALID_CHANGE", `Item ${itemId} is geen lichtpunt.`);
    }
    const legacyChanges = validateAndMapLightPointChanges(changes);
    if (Object.keys(legacyChanges).length === 0) return;
    this.updateItem(itemId, legacyChanges);
  }

  private updateConfiguredItem(itemId: number, changes: ConfiguredItemPropertyChanges): void {
    const item = this.requireItem(itemId);
    const type = item.getType();
    if (!configuredItemTypes.has(type)) {
      throw new SchemaCommandError("INVALID_CHANGE", `Item ${itemId} gebruikt geen geconfigureerde eigenschappen.`);
    }
    const legacyChanges = validateAndMapConfiguredItemChanges(type, changes);
    if (Object.keys(legacyChanges).length === 0) return;
    this.updateItem(itemId, legacyChanges);
  }

  private duplicateItem(itemId: number): number {
    const item = this.requireItem(itemId);
    this.assertUserEditable(item);
    if (!item.checkInsertSibling()) {
      throw new SchemaCommandError("MAX_CHILDREN_REACHED", "De ouder van dit item laat geen extra kinderen toe.");
    }

    return this.commitTransaction(() => {
      const duplicateId = this.structure.curid;
      this.structure.clone(itemId);
      if (this.structure.getElectroItemById(duplicateId) === null) {
        throw new SchemaCommandError("INVALID_CHANGE", "Het item kon niet worden gedupliceerd.");
      }
      return duplicateId;
    });
  }

  private expandItem(itemId: number): void {
    const item = this.requireItem(itemId);
    this.assertUserEditable(item);
    if (!item.isExpandable()) {
      throw new SchemaCommandError("INVALID_CHANGE", `Item ${itemId} kan niet worden uitgepakt.`);
    }
    this.commitTransaction(() => {
      item.expand();
      this.structure.reSort();
    });
  }

  private replaceDocument(serializedDocument: string, version: number = 0): void {
    const replacement = structureFromJson(serializedDocument, null, version);
    this.structure.dispose();
    this.structure = replacement;
    this.serializedSnapshot = this.serialize();
    this.history.reset(this.serializedSnapshot);
    this.publish();
  }

  private undo(): void {
    const serialized = this.history.undo();
    if (serialized === undefined) return;
    this.restore(serialized);
  }

  private redo(): void {
    const serialized = this.history.redo();
    if (serialized === undefined) return;
    this.restore(serialized);
  }

  private getParent(parentId: number | null): Electro_Item | null {
    if (parentId === null) return null;
    const parent = this.structure.getElectroItemById(parentId);
    if (parent === null) {
      throw new SchemaCommandError("PARENT_NOT_FOUND", `Ouderitem ${parentId} bestaat niet.`);
    }
    return parent;
  }

  private requireItem(itemId: number): Electro_Item {
    const item = this.structure.getElectroItemById(itemId);
    if (item === null) {
      throw new SchemaCommandError("ITEM_NOT_FOUND", `Item ${itemId} bestaat niet.`);
    }
    return item;
  }

  private assertChildAllowed(parent: Electro_Item | null, type: string): void {
    const allowed = parent === null
      ? this.structure.allowedRootChilds().includes(type)
      : parent.allowedChilds().includes(type);
    if (!allowed) {
      const parentDescription = parent === null ? "de documentwortel" : `${parent.getType()} ${parent.id}`;
      throw new SchemaCommandError(
        "INVALID_CHILD_TYPE",
        `Itemtype '${type}' is niet toegestaan onder ${parentDescription}.`,
      );
    }
  }

  private assertParentCapacity(parent: Electro_Item | null): void {
    if (parent !== null && !parent.checkInsertChild()) {
      throw new SchemaCommandError("MAX_CHILDREN_REACHED", "De gekozen ouder laat geen extra kinderen toe.");
    }
  }

  private assertNoCycle(itemId: number, targetParent: Electro_Item | null): void {
    let ancestor = targetParent;
    while (ancestor !== null) {
      if (ancestor.id === itemId) {
        throw new SchemaCommandError("CYCLIC_PARENT", "Een item kan niet onder een eigen afstammeling worden geplaatst.");
      }
      ancestor = ancestor.getParent() as Electro_Item | null;
    }
  }

  private assertUserEditable(item: Electro_Item): void {
    if (item.isAttribuut()) {
      throw new SchemaCommandError(
        "INVALID_CHANGE",
        "Gegenereerde attribuutitems kunnen niet afzonderlijk worden aangepast.",
      );
    }
  }

  private moveToSiblingPosition(itemId: number, requestedPosition: number | undefined): void {
    const item = this.requireItem(itemId);
    const siblingIds = this.structure.data
      .filter((candidate) => candidate.parent === item.parent && !(candidate as Electro_Item).isAttribuut())
      .map((candidate) => candidate.id);
    const maximumPosition = Math.max(siblingIds.length - 1, 0);
    const targetPosition = requestedPosition === undefined
      ? maximumPosition
      : Math.min(requestedPosition, maximumPosition);

    let currentPosition = siblingIds.indexOf(itemId);
    while (currentPosition > targetPosition) {
      this.structure.moveUp(itemId);
      currentPosition -= 1;
    }
    while (currentPosition < targetPosition) {
      this.structure.moveDown(itemId);
      currentPosition += 1;
    }
  }

  private commitTransaction<Result>(mutation: () => Result): Result {
    const before = this.serialize();
    try {
      const result = mutation();
      this.structure.voegAttributenToeAlsNodigEnReSort();
      this.structure.reNumber(false);
      this.serializedSnapshot = this.serialize();
      this.history.record(this.serializedSnapshot);
      this.publish();
      return result;
    } catch (error) {
      this.structure = structureFromJson(before, this.structure, 0);
      this.serializedSnapshot = before;
      // A failed command must not advance the public revision, but future
      // reads must point at the restored document rather than the mutated one.
      this.snapshot = this.createSnapshot();
      throw error;
    }
  }

  private restore(serialized: string): void {
    this.structure = structureFromJson(serialized, this.structure, 0);
    this.serializedSnapshot = serialized;
    this.publish();
  }

  private serialize(): string {
    return this.structure.toJsonObject(false);
  }

  private createSnapshot(): SchemaSnapshot {
    return Object.freeze({
      revision: this.revision,
      document: new LegacySchemaDocumentReader(this.structure),
      properties: new LegacySchemaPropertyReader(this.structure),
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    });
  }

  private publish(): void {
    this.revision += 1;
    this.snapshot = this.createSnapshot();
    for (const listener of this.listeners) listener();
  }
}
