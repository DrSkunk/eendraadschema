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
  constructor(private readonly structure: Hierarchical_List) {}

  getRootCapabilities() {
    return Object.freeze({
      canAddChild: true,
      canDelete: false,
      canDuplicate: false,
      allowedChildTypes: Object.freeze(
        this.structure.allowedRootChilds().filter((type) => type !== ""),
      ),
    });
  }

  getItem(id: number): HierarchyViewNode | undefined {
    const ordinal = this.structure.getOrdinalById(id);
    if (ordinal === null || !this.structure.active[ordinal]) return undefined;
    return this.toViewNode(ordinal);
  }

  getChildren(parentId: number | null): HierarchyViewNode[] {
    const legacyParentId = parentId ?? 0;
    return this.activeOrdinals()
      .filter((ordinal) => this.structure.data[ordinal].parent === legacyParentId)
      .map((ordinal) => this.toViewNode(ordinal));
  }

  getRootItems(): HierarchyViewNode[] {
    return this.getChildren(null);
  }

  getAllItems(): HierarchyViewNode[] {
    return this.activeOrdinals().map((ordinal) => this.toViewNode(ordinal));
  }

  getHierarchy(): HierarchyViewNode[] {
    return this.getAllItems();
  }

  private activeOrdinals(): number[] {
    const ordinals: number[] = [];
    for (let ordinal = 0; ordinal < this.structure.length; ordinal += 1) {
      if (this.structure.active[ordinal]) ordinals.push(ordinal);
    }
    return ordinals;
  }

  private toViewNode(ordinal: number): HierarchyViewNode {
    const item = this.structure.data[ordinal] as Electro_Item;
    const summary = getSummary(item);
    const role = getRole(item);
    const isEditableItem = role === "item";
    const childIds = this.activeOrdinals()
      .filter((childOrdinal) => this.structure.data[childOrdinal].parent === item.id)
      .map((childOrdinal) => this.structure.id[childOrdinal]);

    return Object.freeze({
      id: item.id,
      parentId: item.parent === 0 ? null : item.parent,
      type: item.getType() ?? "",
      label: getLabel(item.getType() ?? "", summary),
      description: getDescription(summary),
      childIds: Object.freeze(childIds),
      summary,
      role,
      capabilities: Object.freeze({
        canAddChild: isEditableItem && item.checkInsertChild(),
        canDelete: isEditableItem,
        canDuplicate: isEditableItem && item.checkInsertSibling(),
        allowedChildTypes: isEditableItem ? allowedChildTypes(item) : Object.freeze([]),
      }),
    });
  }
}
