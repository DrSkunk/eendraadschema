export type HierarchyNodeRole = "item" | "attribute" | "container";

export interface HierarchyNodeCapabilities {
  readonly canAddChild: boolean;
  readonly canDelete: boolean;
  readonly canDuplicate: boolean;
  readonly allowedChildTypes: readonly string[];
}

export interface HierarchyItemSummary {
  readonly name?: string;
  readonly number?: string;
  readonly address?: string;
  readonly text?: string;
}

export interface HierarchyViewNode {
  readonly id: number;
  readonly parentId: number | null;
  readonly type: string;
  readonly label: string;
  readonly description?: string;
  readonly childIds: readonly number[];
  readonly summary: HierarchyItemSummary;
  readonly role: HierarchyNodeRole;
  readonly capabilities: HierarchyNodeCapabilities;
}

export interface SchemaDocumentReader {
  getItem(id: number): HierarchyViewNode | undefined;
  getChildren(parentId: number | null): HierarchyViewNode[];
  getRootItems(): HierarchyViewNode[];
  getAllItems(): HierarchyViewNode[];
  getHierarchy(): HierarchyViewNode[];
}
