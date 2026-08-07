import type { SchemaDocumentReader } from "./SchemaDocumentReader";
import type { SchemaPropertyReader } from "./SchemaPropertyReader";
import type { CircuitPropertyChanges } from "./SchemaPropertyReader";

export interface SchemaSnapshot {
  readonly revision: number;
  readonly document: SchemaDocumentReader;
  readonly properties: SchemaPropertyReader;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export interface MoveItemOptions {
  readonly targetParentId: number | null;
  readonly position?: number;
}

export interface SchemaCommands {
  addItem(parentId: number | null, type: string): number;
  deleteItem(itemId: number): void;
  moveItem(itemId: number, options: MoveItemOptions): void;
  updateItem(itemId: number, changes: Readonly<Record<string, unknown>>): void;
  updateCircuit(itemId: number, changes: Readonly<CircuitPropertyChanges>): void;
  duplicateItem(itemId: number): number;
  replaceDocument(serializedDocument: string, version?: number): void;
  undo(): void;
  redo(): void;
}

export interface SchemaStore {
  getSnapshot(): SchemaSnapshot;
  subscribe(listener: () => void): () => void;
  readonly commands: SchemaCommands;
}

export type SchemaCommandErrorCode =
  | "ITEM_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "INVALID_CHILD_TYPE"
  | "MAX_CHILDREN_REACHED"
  | "CYCLIC_PARENT"
  | "INVALID_POSITION"
  | "INVALID_CHANGE";

export class SchemaCommandError extends Error {
  constructor(
    public readonly code: SchemaCommandErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SchemaCommandError";
  }
}
