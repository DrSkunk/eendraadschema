import type { SituationPlanDefaults } from "../sitplan/SituationPlan";
import type { AdresLocation, AdresType } from "../sitplan/SituationPlanElement";

export interface SituationPlanElementChanges {
  readonly page?: number;
  readonly position?: Readonly<{ x: number; y: number }>;
  readonly labelFontSize?: number;
  readonly addressType?: AdresType;
  readonly address?: string;
  readonly addressLocation?: AdresLocation;
  readonly rotation?: number;
  readonly scale?: number;
  readonly movable?: boolean;
}

export interface SituationPlanElementSnapshot {
  readonly id: string;
  readonly page: number;
  readonly position: Readonly<{ x: number; y: number }>;
  readonly size: Readonly<{ width: number; height: number }>;
  readonly labelPosition: Readonly<{ x: number; y: number }>;
  readonly labelFontSize: number;
  readonly addressType: string | null;
  readonly address: string | null;
  readonly addressLocation: string;
  readonly rotation: number;
  readonly scale: number;
  readonly movable: boolean;
  readonly svg: string;
  readonly electroItemId: number | null;
}

export interface SituationPlanSnapshot {
  readonly revision: number;
  readonly activePage: number;
  readonly pageCount: number;
  readonly defaults: Readonly<SituationPlanDefaults>;
  readonly elements: readonly SituationPlanElementSnapshot[];
}

export interface SituationPlanCommands {
  selectPage(page: number): void;
  addPage(): number;
  deletePage(page: number): void;
  updateDefaults(changes: Partial<SituationPlanDefaults>): void;
  updateElement(elementId: string, changes: SituationPlanElementChanges): void;
}

export interface SituationPlanStore {
  getSnapshot(): SituationPlanSnapshot;
  subscribe(listener: () => void): () => void;
  readonly commands: SituationPlanCommands;
}

export type SituationPlanCommandErrorCode =
  | "INVALID_PAGE"
  | "LAST_PAGE"
  | "INVALID_DEFAULT"
  | "ELEMENT_NOT_FOUND"
  | "INVALID_ELEMENT_CHANGE";

export class SituationPlanCommandError extends Error {
  constructor(
    public readonly code: SituationPlanCommandErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SituationPlanCommandError";
  }
}
