import { createPortal } from "react-dom";
import type { EditorStore } from "../application/EditorStore";
import type { SchemaStore } from "../application/SchemaStore";
import { HierarchyTree } from "./hierarchy/HierarchyTree";
import { EditorShell } from "./layout/EditorShell";
import { useSchemaSnapshot } from "./useSchemaSnapshot";
import "./editor-shell.css";
import "./hierarchy/hierarchy.css";

export interface EditorAppProps {
  readonly schemaStore: SchemaStore;
  readonly editorStore: EditorStore;
  readonly hierarchyMountElement: HTMLElement | null;
}

export function EditorApp({ schemaStore, editorStore, hierarchyMountElement }: EditorAppProps) {
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
    </>
  );
}
