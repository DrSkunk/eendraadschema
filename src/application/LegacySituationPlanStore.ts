import type { Hierarchical_List } from "../Hierarchical_List";
import type { SituationPlan } from "../sitplan/SituationPlan";
import type { SituationPlanElement } from "../sitplan/SituationPlanElement";
import {
  SituationPlanCommandError,
  type SituationPlanCommands,
  type SituationPlanElementChanges,
  type SituationPlanElementUpdate,
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
      updateElement: this.updateElement.bind(this),
      updateElements: this.updateElements.bind(this),
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

  private updateElement(elementId: string, changes: SituationPlanElementChanges): void {
    this.updateElements([{ elementId, changes }]);
  }

  private updateElements(updates: readonly SituationPlanElementUpdate[]): void {
    const elementIds = new Set<string>();
    const prepared = updates.map(({ elementId, changes }) => {
      if (elementIds.has(elementId)) {
        throw new SituationPlanCommandError(
          "INVALID_ELEMENT_CHANGE",
          `Plaatsing '${elementId}' komt meer dan eenmaal voor in dezelfde wijziging.`,
        );
      }
      elementIds.add(elementId);
      return this.prepareElementUpdate(elementId, changes);
    }).filter(update => update.changed);
    if (prepared.length === 0) return;

    this.commit(() => {
      for (const update of prepared) {
        this.applyElementChanges(update.element, update.serialized, update.changes);
      }
    });
  }

  private prepareElementUpdate(elementId: string, changes: SituationPlanElementChanges) {
    const element = this.plan.getElements().find(candidate => candidate.id === elementId);
    if (!element) {
      throw new SituationPlanCommandError(
        "ELEMENT_NOT_FOUND",
        `Situatieplanplaatsing '${elementId}' bestaat niet.`,
      );
    }
    if (changes.page !== undefined) this.assertPage(changes.page);
    if (changes.position !== undefined && (
      !Number.isFinite(changes.position.x) || !Number.isFinite(changes.position.y)
    )) {
      throw new SituationPlanCommandError("INVALID_ELEMENT_CHANGE", "De positie moet uit geldige getallen bestaan.");
    }
    if (changes.labelFontSize !== undefined && (
      !Number.isFinite(changes.labelFontSize) || changes.labelFontSize <= 0
    )) {
      throw new SituationPlanCommandError("INVALID_ELEMENT_CHANGE", "De lettergrootte moet groter zijn dan nul.");
    }
    if (changes.scale !== undefined && (!Number.isFinite(changes.scale) || changes.scale <= 0)) {
      throw new SituationPlanCommandError("INVALID_ELEMENT_CHANGE", "De schaal moet groter zijn dan nul.");
    }
    if (changes.rotation !== undefined && !Number.isFinite(changes.rotation)) {
      throw new SituationPlanCommandError("INVALID_ELEMENT_CHANGE", "De rotatie moet een geldig getal zijn.");
    }

    const serialized = element.toJsonObject();
    const changed = (
      (changes.page !== undefined && changes.page !== serialized.page)
      || (changes.position !== undefined && (
        changes.position.x !== serialized.posx || changes.position.y !== serialized.posy
      ))
      || (changes.labelFontSize !== undefined && changes.labelFontSize !== serialized.labelfontsize)
      || (changes.addressType !== undefined && changes.addressType !== serialized.adrestype)
      || (changes.address !== undefined && changes.address !== serialized.adres)
      || (changes.addressLocation !== undefined && changes.addressLocation !== serialized.adreslocation)
      || (changes.rotation !== undefined && changes.rotation !== serialized.rotate)
      || (changes.scale !== undefined && changes.scale !== serialized.scale)
      || (changes.movable !== undefined && changes.movable !== serialized.movable)
    );
    return { changed, changes, element, serialized };
  }

  private applyElementChanges(
    element: SituationPlanElement,
    serialized: ReturnType<SituationPlanElement["toJsonObject"]>,
    changes: SituationPlanElementChanges,
  ): void {
    if (changes.page !== undefined) element.page = changes.page;
    if (changes.position !== undefined) {
      element.posx = changes.position.x;
      element.posy = changes.position.y;
    }
    if (changes.labelFontSize !== undefined) element.labelfontsize = changes.labelFontSize;
    if (
      changes.addressType !== undefined
      || changes.address !== undefined
      || changes.addressLocation !== undefined
    ) {
      const addressType = changes.addressType ?? (serialized.adrestype === "manueel" ? "manueel" : "auto");
      const addressLocation = changes.addressLocation ?? (
        serialized.adreslocation === "links"
          ? "links"
          : serialized.adreslocation === "boven"
            ? "boven"
            : serialized.adreslocation === "onder"
              ? "onder"
              : "rechts"
      );
      element.setAdres(
        addressType,
        changes.address ?? serialized.adres ?? "",
        addressLocation,
      );
    }
    if (changes.rotation !== undefined) element.rotate = changes.rotation;
    if (changes.scale !== undefined) element.setscale(changes.scale);
    if (changes.movable !== undefined) element.movable = changes.movable;
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
