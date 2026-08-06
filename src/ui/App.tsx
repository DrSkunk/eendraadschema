import type { SchemaStore } from "../application/SchemaStore";
import { EditorShell } from "./layout/EditorShell";
import { useSchemaSnapshot } from "./useSchemaSnapshot";
import "./editor-shell.css";

export interface EditorAppProps {
  readonly schemaStore: SchemaStore;
}

export function EditorApp({ schemaStore }: EditorAppProps) {
  const snapshot = useSchemaSnapshot(schemaStore);
  const itemCount = snapshot.document
    .getAllItems()
    .filter((item) => item.role === "item").length;

  return <EditorShell itemCount={itemCount} />;
}
