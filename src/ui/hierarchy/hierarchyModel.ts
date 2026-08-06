import type {
  HierarchyViewNode,
  SchemaDocumentReader,
} from "../../application/SchemaDocumentReader";

export interface VisibleHierarchyNode {
  readonly node: HierarchyViewNode;
  readonly depth: number;
}

export interface HierarchyIndex {
  readonly childrenByParent: ReadonlyMap<number | null, readonly HierarchyViewNode[]>;
}

const EMPTY_CHILDREN: readonly HierarchyViewNode[] = Object.freeze([]);

export function createHierarchyIndex(document: SchemaDocumentReader): HierarchyIndex {
  const childrenByParent = new Map<number | null, HierarchyViewNode[]>();
  for (const node of document.getAllItems()) {
    if (node.role !== "item") continue;
    const siblings = childrenByParent.get(node.parentId);
    if (siblings) siblings.push(node);
    else childrenByParent.set(node.parentId, [node]);
  }
  return { childrenByParent };
}

export function getEditableChildren(
  index: HierarchyIndex,
  parentId: number | null,
): readonly HierarchyViewNode[] {
  return index.childrenByParent.get(parentId) ?? EMPTY_CHILDREN;
}

export function getVisibleHierarchy(
  index: HierarchyIndex,
  expandedItemIds: ReadonlySet<number>,
): VisibleHierarchyNode[] {
  const visible: VisibleHierarchyNode[] = [];

  function appendChildren(parentId: number | null, depth: number): void {
    for (const node of getEditableChildren(index, parentId)) {
      visible.push({ node, depth });
      if (expandedItemIds.has(node.id)) appendChildren(node.id, depth + 1);
    }
  }

  appendChildren(null, 0);
  return visible;
}
