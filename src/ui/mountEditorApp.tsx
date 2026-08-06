import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SchemaStore } from "../application/SchemaStore";
import { EditorApp } from "./App";

export function mountEditorApp(element: HTMLElement, schemaStore: SchemaStore): Root {
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <EditorApp schemaStore={schemaStore} />
    </StrictMode>,
  );
  return root;
}
