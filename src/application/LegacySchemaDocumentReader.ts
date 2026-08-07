import { Hierarchical_List } from "../Hierarchical_List";
import { Electro_Item } from "../List_Item/Electro_Item";
import type {
  HierarchyNodeRole,
  HierarchyItemSummary,
  HierarchyViewNode,
  SchemaDocumentReader,
} from "./SchemaDocumentReader";

function nonEmptyString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

function getSummary(item: Electro_Item): HierarchyItemSummary {
  return Object.freeze({
    name: nonEmptyString(item.props.naam),
    number: nonEmptyString(item.props.nr),
    address: nonEmptyString(item.props.adres),
    text: nonEmptyString(item.props.tekst),
  });
}

type LabelFormatter = (type: string, summary: HierarchyItemSummary) => string;

const labelFormatters: Readonly<Record<string, LabelFormatter>> = Object.freeze({
  "": () => "Nieuw element",
  Bord: (type, summary) => summary.name ?? type,
  Kring: (type, summary) => summary.name ? `${type} ${summary.name}` : type,
});

function getLabel(type: string, summary: HierarchyItemSummary): string {
  const formatter = labelFormatters[type];
  if (formatter) return formatter(type, summary);

  if (summary.name) return `${type} — ${summary.name}`;
  if (summary.number) return `${type} ${summary.number}`;
  return type;
}

function getDescription(summary: HierarchyItemSummary): string | undefined {
  return summary.text ?? summary.address;
}

function getRole(item: Electro_Item): HierarchyNodeRole {
  if (item.getType() === "Container") return "container";
  if (item.isAttribuut()) return "attribute";
  return "item";
}

function allowedChildTypes(item: Electro_Item): readonly string[] {
  return Object.freeze(
    item.allowedChilds().filter((type) => type !== "" && type !== "-" && type !== "---"),
  );
}

/**
 * Read-only projection over the current legacy document.
 *
 * The legacy Hierarchical_List remains the source of truth. Every call creates
 * fresh, frozen hierarchy summaries so consumers cannot mutate the document by
 * retaining or editing a returned node. Type-specific property data belongs to
 * a separate property-editor adapter.
 */
export class LegacySchemaDocumentReader implements SchemaDocumentReader {
  private readonly rootCapabilities;
  private readonly items: readonly HierarchyViewNode[];
  private readonly itemsById: ReadonlyMap<number, HierarchyViewNode>;
  private readonly childrenByParent: ReadonlyMap<number | null, readonly HierarchyViewNode[]>;

  constructor(structure: Hierarchical_List) {
    const activeItems: Electro_Item[] = [];
    for (let ordinal = 0; ordinal < structure.length; ordinal += 1) {
      if (structure.active[ordinal]) activeItems.push(structure.data[ordinal] as Electro_Item);
    }

    const childIdsByParent = new Map<number, number[]>();
    for (const item of activeItems) {
      const childIds = childIdsByParent.get(item.parent);
      if (childIds) childIds.push(item.id);
      else childIdsByParent.set(item.parent, [item.id]);
    }

    this.rootCapabilities = Object.freeze({
      canAddChild: true,
      canDelete: false,
      canDuplicate: false,
      canExpand: false,
      allowedChildTypes: Object.freeze(
        structure.allowedRootChilds().filter((type) => type !== ""),
      ),
      allowedItemTypes: Object.freeze([]),
    });
    this.items = Object.freeze(activeItems.map((item) => this.toViewNode(
      item,
      childIdsByParent.get(item.id) ?? [],
    )));
    this.itemsById = new Map(this.items.map((item) => [item.id, item]));

    const childrenByParent = new Map<number | null, HierarchyViewNode[]>();
    for (const item of this.items) {
      const siblings = childrenByParent.get(item.parentId);
      if (siblings) siblings.push(item);
      else childrenByParent.set(item.parentId, [item]);
    }
    this.childrenByParent = new Map(
      Array.from(childrenByParent, ([parentId, children]) => [parentId, Object.freeze(children)]),
    );
  }

  getRootCapabilities() {
    return this.rootCapabilities;
  }

  getItem(id: number): HierarchyViewNode | undefined {
    return this.itemsById.get(id);
  }

  getChildren(parentId: number | null): readonly HierarchyViewNode[] {
    return this.childrenByParent.get(parentId) ?? Object.freeze([]);
  }

  getRootItems(): readonly HierarchyViewNode[] {
    return this.getChildren(null);
  }

  getAllItems(): readonly HierarchyViewNode[] {
    return this.items;
  }

  getHierarchy(): readonly HierarchyViewNode[] {
    return this.items;
  }

  private toViewNode(item: Electro_Item, childIds: readonly number[]): HierarchyViewNode {
    const summary = getSummary(item);
    const role = getRole(item);
    const isEditableItem = role === "item";
    return Object.freeze({
      id: item.id,
      parentId: item.parent === 0 ? null : item.parent,
      type: item.getType() ?? "",
      label: getLabel(item.getType() ?? "", summary),
      description: getDescription(summary),
      childIds: Object.freeze([...childIds]),
      summary,
      role,
      capabilities: Object.freeze({
        canAddChild: isEditableItem && item.checkInsertChild(),
        canDelete: isEditableItem,
        canDuplicate: isEditableItem && item.checkInsertSibling(),
        canExpand: isEditableItem && item.isExpandable(),
        allowedChildTypes: isEditableItem ? allowedChildTypes(item) : Object.freeze([]),
        allowedItemTypes: isEditableItem ? Object.freeze(Array.from(new Set([
          item.getType(),
          ...(item.parent === 0 ? item.sourcelist.allowedRootChilds() : item.getParent().allowedChilds()),
        ])).filter((type) => type !== "" && type !== "-" && type !== "---")) : Object.freeze([]),
      }),
    });
  }
}
