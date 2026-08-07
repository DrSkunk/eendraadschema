import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { EditorStore } from "../application/EditorStore";
import type { SchemaStore } from "../application/SchemaStore";
import { EditorApp } from "./App";

export function mountEditorApp(
  element: HTMLElement,
  schemaStore: SchemaStore,
  editorStore: EditorStore,
  hierarchyMountElement: HTMLElement | null,
  propertiesMountElement: HTMLElement | null = null,
): Root {
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <EditorApp
        schemaStore={schemaStore}
        editorStore={editorStore}
        hierarchyMountElement={hierarchyMountElement}
        propertiesMountElement={propertiesMountElement}
      />
    </StrictMode>,
  );
  return root;
}
