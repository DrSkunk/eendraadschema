import type { EditorStore } from "../../application/EditorStore";
import type { SchemaStore } from "../../application/SchemaStore";
import { useEditorSnapshot } from "../useEditorSnapshot";
import { useSchemaSnapshot } from "../useSchemaSnapshot";
import { propertyEditors } from "./propertyEditors";

interface ItemPropertiesPanelProps {
  readonly schemaStore: SchemaStore;
  readonly editorStore: EditorStore;
}

export function ItemPropertiesPanel({ schemaStore, editorStore }: ItemPropertiesPanelProps) {
  const schema = useSchemaSnapshot(schemaStore);
  const editor = useEditorSnapshot(editorStore);
  const item = editor.selectedItemId === null
    ? undefined
    : schema.document.getItem(editor.selectedItemId);
  const PropertyEditor = item === undefined ? undefined : propertyEditors[item.type];

  return (
    <section className="react-properties" aria-labelledby="react-properties-title">
      <header className="react-properties__header">
        <span className="react-properties__eyebrow">Selectie</span>
        <h2 id="react-properties-title">Eigenschappen</h2>
      </header>
      {item === undefined ? (
        <p className="react-properties__empty">Selecteer een onderdeel om de eigenschappen te bewerken.</p>
      ) : PropertyEditor === undefined ? (
        <div className="react-properties__empty">
          <strong>{item.label}</strong>
          <p>De eigenschappen van dit onderdeel worden nog door de bestaande editor beheerd.</p>
        </div>
      ) : (
        <PropertyEditor itemId={item.id} schemaStore={schemaStore} editorStore={editorStore} />
      )}
    </section>
  );
}
