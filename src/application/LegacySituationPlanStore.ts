import type { Hierarchical_List } from "../Hierarchical_List";
import type { SituationPlan } from "../sitplan/SituationPlan";
import type { SituationPlanElement } from "../sitplan/SituationPlanElement";
import {
  SituationPlanCommandError,
  type SituationPlanCommands,
  type SituationPlanElementSnapshot,
  type SituationPlanSnapshot,
  type SituationPlanStore,
} from "./SituationPlanStore";

export type SituationPlanMutationCommitted = () => void;

export class LegacySituationPlanStore implements SituationPlanStore {
  private structure: Hierarchical_List;
  private readonly listeners = new Set<() => void>();
  private revision = 0;
  private snapshot: SituationPlanSnapshot;
  private stateKey: string;

  readonly commands: SituationPlanCommands;

  constructor(
    structure: Hierarchical_List,
    private readonly mutationCommitted?: SituationPlanMutationCommitted,
  ) {
    this.structure = structure;
    this.snapshot = this.createSnapshot();
    this.stateKey = this.createStateKey(this.snapshot);
    this.commands = Object.freeze({
      selectPage: this.selectPage.bind(this),
      addPage: this.addPage.bind(this),
      deletePage: this.deletePage.bind(this),
      updateDefaults: this.updateDefaults.bind(this),
    });
  }

  getSnapshot(): SituationPlanSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Transitional seam for the legacy canvas while its interactions are migrated. */
  synchronizeLegacyDocument(structure: Hierarchical_List = this.structure): void {
    this.structure = structure;
    const nextSnapshot = this.createSnapshot();
    const nextStateKey = this.createStateKey(nextSnapshot);
    if (nextStateKey === this.stateKey) return;
    this.publish();
  }

  getLegacyDocument(): Hierarchical_List {
    return this.structure;
  }

  private selectPage(page: number): void {
    this.assertPage(page);
    if (page === this.plan.getActivePage()) return;
    this.commit(() => this.plan.setActivePage(page));
  }

  private addPage(): number {
    return this.commit(() => {
      const page = this.plan.addPage();
      this.plan.setActivePage(page);
      return page;
    });
  }

  private deletePage(page: number): void {
    this.assertPage(page);
    if (this.plan.getPageCount() === 1) {
      throw new SituationPlanCommandError("LAST_PAGE", "De laatste pagina kan niet worden verwijderd.");
    }
    this.commit(() => this.plan.deletePage(page));
  }

  private updateDefaults(changes: Parameters<SituationPlan["updateDefaults"]>[0]): void {
    if (changes.fontsize !== undefined && (!Number.isFinite(changes.fontsize) || changes.fontsize <= 0)) {
      throw new SituationPlanCommandError("INVALID_DEFAULT", "De lettergrootte moet groter zijn dan nul.");
    }
    if (changes.scale !== undefined && (!Number.isFinite(changes.scale) || changes.scale <= 0)) {
      throw new SituationPlanCommandError("INVALID_DEFAULT", "De schaal moet groter zijn dan nul.");
    }
    if (changes.rotate !== undefined && !Number.isFinite(changes.rotate)) {
      throw new SituationPlanCommandError("INVALID_DEFAULT", "De rotatie moet een eindig getal zijn.");
    }

    const defaults = this.plan.getDefaults();
    const changed = Object.entries(changes).some(
      ([key, value]) => defaults[key as keyof typeof defaults] !== value,
    );
    if (!changed) return;
    this.commit(() => this.plan.updateDefaults(changes));
  }

  private assertPage(page: number): void {
    if (!Number.isInteger(page) || page < 1 || page > this.plan.getPageCount()) {
      throw new SituationPlanCommandError(
        "INVALID_PAGE",
        `Pagina ${page} bestaat niet in het situatieplan.`,
      );
    }
  }

  private commit<Result>(mutation: () => Result): Result {
    const result = mutation();
    this.mutationCommitted?.();
    this.publish();
    return result;
  }

  private get plan(): SituationPlan {
    return this.structure.sitplan;
  }

  private createSnapshot(): SituationPlanSnapshot {
    return Object.freeze({
      revision: this.revision,
      activePage: this.plan.getActivePage(),
      pageCount: this.plan.getPageCount(),
      defaults: Object.freeze({ ...this.plan.getDefaults() }),
      elements: Object.freeze(this.plan.getElements().map(element => this.createElementSnapshot(element))),
    });
  }

  private createElementSnapshot(element: SituationPlanElement): SituationPlanElementSnapshot {
    const serialized = element.toJsonObject();
    return Object.freeze({
      id: element.id,
      page: serialized.page,
      position: Object.freeze({ x: serialized.posx, y: serialized.posy }),
      size: Object.freeze({ width: serialized.sizex, height: serialized.sizey }),
      labelPosition: Object.freeze({ x: serialized.labelposx, y: serialized.labelposy }),
      labelFontSize: serialized.labelfontsize,
      addressType: serialized.adrestype,
      address: serialized.adres,
      addressLocation: serialized.adreslocation,
      rotation: serialized.rotate,
      scale: serialized.scale,
      movable: serialized.movable,
      svg: serialized.svg,
      electroItemId: serialized.electroItemId,
    });
  }

  private publish(): void {
    this.revision += 1;
    this.snapshot = this.createSnapshot();
    this.stateKey = this.createStateKey(this.snapshot);
    for (const listener of this.listeners) listener();
  }

  private createStateKey(snapshot: SituationPlanSnapshot): string {
    return JSON.stringify({
      activePage: snapshot.activePage,
      pageCount: snapshot.pageCount,
      defaults: snapshot.defaults,
      elements: snapshot.elements,
    });
  }
}
