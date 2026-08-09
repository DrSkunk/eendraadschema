import { createPortal } from "react-dom";
import type { EditorStore } from "../application/EditorStore";
import type { SaveStatusStore } from "../application/SaveStatusStore";
import type { SchemaStore } from "../application/SchemaStore";
import { HierarchyTree } from "./hierarchy/HierarchyTree";
import { EditorShell } from "./layout/EditorShell";
import { StatusBar } from "./layout/StatusBar";
import { ItemPropertiesPanel } from "./properties/ItemPropertiesPanel";
import { useSchemaSnapshot } from "./useSchemaSnapshot";
import "./editor-shell.css";
import "./hierarchy/hierarchy.css";
import "./properties/properties.css";

export interface EditorAppProps {
  readonly schemaStore: SchemaStore;
  readonly editorStore: EditorStore;
  readonly hierarchyMountElement: HTMLElement | null;
  readonly propertiesMountElement?: HTMLElement | null;
  readonly saveStatusStore?: SaveStatusStore | null;
  readonly statusBarMountElement?: HTMLElement | null;
  readonly zoomTargetElement?: HTMLElement | null;
}

export function EditorApp({
  schemaStore,
  editorStore,
  hierarchyMountElement,
  propertiesMountElement = null,
  saveStatusStore = null,
  statusBarMountElement = null,
  zoomTargetElement = null,
}: EditorAppProps) {
  const snapshot = useSchemaSnapshot(schemaStore);
  const itemCount = snapshot.document
    .getAllItems()
    .filter((item) => item.role === "item").length;

  return (
    <>
      <EditorShell itemCount={itemCount} />
      {hierarchyMountElement
        ? createPortal(
            <HierarchyTree schemaStore={schemaStore} editorStore={editorStore} />,
            hierarchyMountElement,
          )
        : null}
      {propertiesMountElement
        ? createPortal(
            <ItemPropertiesPanel schemaStore={schemaStore} editorStore={editorStore} />,
            propertiesMountElement,
          )
        : null}
      {statusBarMountElement && saveStatusStore
        ? createPortal(
            <StatusBar
              schemaStore={schemaStore}
              editorStore={editorStore}
              saveStatusStore={saveStatusStore}
              zoomTargetElement={zoomTargetElement}
            />,
            statusBarMountElement,
          )
        : null}
    </>
  );
}
