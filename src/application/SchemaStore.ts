import type { SchemaDocumentReader } from "./SchemaDocumentReader";
import type { SchemaPropertyReader } from "./SchemaPropertyReader";
import type { ConfiguredItemPropertyChanges } from "./ConfiguredItemProperties";
import type { ValidationIssue } from "./SchemaValidation";
import type {
  BasicConsumerPropertyChanges,
  CircuitPropertyChanges,
  SocketPropertyChanges,
  LightPointPropertyChanges,
} from "./SchemaPropertyReader";

export interface SchemaSnapshot {
  readonly revision: number;
  readonly document: SchemaDocumentReader;
  readonly properties: SchemaPropertyReader;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly validationIssues: readonly ValidationIssue[];
}

export interface MoveItemOptions {
  readonly targetParentId: number | null;
  readonly position?: number;
}

export interface AddDistributionBoardProperties {
  readonly name: string;
  readonly location?: string;
  readonly cableType?: string;
  readonly conductorSection?: string;
  readonly lengthMeters?: number;
}

export interface UpdateDistributionBoardChanges {
  readonly name?: string;
  readonly location?: string;
  readonly sourceCircuitId?: number;
  readonly cableType?: string;
  readonly conductorSection?: string;
  readonly lengthMeters?: number;
}

export interface UpdateDocumentDetailsChanges {
  readonly owner?: string;
  readonly installer?: string;
  readonly control?: string;
  readonly info?: string;
}

export interface SchemaCommands {
  addItem(parentId: number | null, type: string): number;
  deleteItem(itemId: number): void;
  moveItem(itemId: number, options: MoveItemOptions): void;
  changeItemType(itemId: number, type: string): void;
  updateItem(itemId: number, changes: Readonly<Record<string, unknown>>): void;
  updateCircuit(itemId: number, changes: Readonly<CircuitPropertyChanges>): void;
  updateSocket(itemId: number, changes: Readonly<SocketPropertyChanges>): void;
  updateBasicConsumer(itemId: number, changes: Readonly<BasicConsumerPropertyChanges>): void;
  updateLightPoint(itemId: number, changes: Readonly<LightPointPropertyChanges>): void;
  updateConfiguredItem(itemId: number, changes: ConfiguredItemPropertyChanges): void;
  duplicateItem(itemId: number): number;
  expandItem(itemId: number): void;
  addDistributionBoard(feederCircuitId: number, properties: AddDistributionBoardProperties): string;
  updateDistributionBoard(boardId: string, changes: UpdateDistributionBoardChanges): void;
  deleteDistributionBoard(boardId: string): void;
  updateDocumentDetails(changes: UpdateDocumentDetailsChanges): void;
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
  | "INVALID_CHANGE"
  | "BOARD_NOT_FOUND"
  | "INVALID_BOARD_FEEDER"
  | "BOARD_DEPENDENCY";

export class SchemaCommandError extends Error {
  constructor(
    public readonly code: SchemaCommandErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SchemaCommandError";
  }
}
