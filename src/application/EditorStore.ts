export interface EditorSnapshot {
  readonly revision: number;
  readonly selectedItemId: number | null;
  readonly activeBoardId: string;
  readonly expandedItemIds: ReadonlySet<number>;
}

export interface EditorCommands {
  selectItem(itemId: number | null): void;
  selectBoard(boardId: string, fallbackItemId?: number | null): void;
  toggleExpanded(itemId: number): void;
  expandItem(itemId: number): void;
  collapseItem(itemId: number): void;
  reconcileItemIds(validItemIds: ReadonlySet<number>): void;
  reconcileBoardIds(validBoardIds: ReadonlySet<string>, fallbackBoardId: string): void;
}

export interface EditorStore {
  getSnapshot(): EditorSnapshot;
  subscribe(listener: () => void): () => void;
  readonly commands: EditorCommands;
}

export class LocalEditorStore implements EditorStore {
  private readonly listeners = new Set<() => void>();
  private readonly expandedItemIds = new Set<number>();
  private selectedItemId: number | null = null;
  private activeBoardId = "main";
  private revision = 0;
  private snapshot = this.createSnapshot();

  readonly commands: EditorCommands = Object.freeze({
    selectItem: this.selectItem.bind(this),
    selectBoard: this.selectBoard.bind(this),
    toggleExpanded: this.toggleExpanded.bind(this),
    expandItem: this.expandItem.bind(this),
    collapseItem: this.collapseItem.bind(this),
    reconcileItemIds: this.reconcileItemIds.bind(this),
    reconcileBoardIds: this.reconcileBoardIds.bind(this),
  });

  getSnapshot(): EditorSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private selectItem(itemId: number | null): void {
    if (this.selectedItemId === itemId) return;
    this.selectedItemId = itemId;
    this.publish();
  }

  private selectBoard(boardId: string, fallbackItemId: number | null = null): void {
    if (this.activeBoardId === boardId && this.selectedItemId === fallbackItemId) return;
    this.activeBoardId = boardId;
    this.selectedItemId = fallbackItemId;
    this.publish();
  }

  private toggleExpanded(itemId: number): void {
    if (this.expandedItemIds.has(itemId)) this.expandedItemIds.delete(itemId);
    else this.expandedItemIds.add(itemId);
    this.publish();
  }

  private expandItem(itemId: number): void {
    if (this.expandedItemIds.has(itemId)) return;
    this.expandedItemIds.add(itemId);
    this.publish();
  }

  private collapseItem(itemId: number): void {
    if (!this.expandedItemIds.delete(itemId)) return;
    this.publish();
  }

  private reconcileItemIds(validItemIds: ReadonlySet<number>): void {
    let changed = false;
    if (this.selectedItemId !== null && !validItemIds.has(this.selectedItemId)) {
      this.selectedItemId = null;
      changed = true;
    }
    for (const itemId of this.expandedItemIds) {
      if (!validItemIds.has(itemId)) {
        this.expandedItemIds.delete(itemId);
        changed = true;
      }
    }
    if (changed) this.publish();
  }

  private reconcileBoardIds(validBoardIds: ReadonlySet<string>, fallbackBoardId: string): void {
    if (validBoardIds.has(this.activeBoardId)) return;
    this.activeBoardId = fallbackBoardId;
    this.selectedItemId = null;
    this.publish();
  }

  private createSnapshot(): EditorSnapshot {
    return Object.freeze({
      revision: this.revision,
      selectedItemId: this.selectedItemId,
      activeBoardId: this.activeBoardId,
      expandedItemIds: new Set(this.expandedItemIds),
    });
  }

  private publish(): void {
    this.revision += 1;
    this.snapshot = this.createSnapshot();
    for (const listener of this.listeners) listener();
  }
}
