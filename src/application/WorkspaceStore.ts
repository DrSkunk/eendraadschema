export type WorkspaceTab = "schema" | "situation";

export interface WorkspaceSnapshot {
  readonly activeTab: WorkspaceTab;
}

export interface WorkspaceCommands {
  selectTab(tab: WorkspaceTab): void;
}

export interface WorkspaceStore {
  getSnapshot(): WorkspaceSnapshot;
  subscribe(listener: () => void): () => void;
  readonly commands: WorkspaceCommands;
}

export class LocalWorkspaceStore implements WorkspaceStore {
  private readonly listeners = new Set<() => void>();
  private activeTab: WorkspaceTab = "schema";
  private snapshot = this.createSnapshot();

  readonly commands: WorkspaceCommands = Object.freeze({
    selectTab: this.selectTab.bind(this),
  });

  getSnapshot(): WorkspaceSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private selectTab(tab: WorkspaceTab): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;
    this.snapshot = this.createSnapshot();
    for (const listener of this.listeners) listener();
  }

  private createSnapshot(): WorkspaceSnapshot {
    return Object.freeze({ activeTab: this.activeTab });
  }
}
