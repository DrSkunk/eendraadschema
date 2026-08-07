export type HierarchyNodeRole = "item" | "attribute" | "container";

export interface HierarchyNodeCapabilities {
  readonly canAddChild: boolean;
  readonly canDelete: boolean;
  readonly canDuplicate: boolean;
  readonly canExpand: boolean;
  readonly allowedChildTypes: readonly string[];
  readonly allowedItemTypes: readonly string[];
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
  getRootCapabilities(): HierarchyNodeCapabilities;
  getItem(id: number): HierarchyViewNode | undefined;
  getChildren(parentId: number | null): readonly HierarchyViewNode[];
  getRootItems(): readonly HierarchyViewNode[];
  getAllItems(): readonly HierarchyViewNode[];
  getHierarchy(): readonly HierarchyViewNode[];
}
