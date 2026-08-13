import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { EditorStore } from "../application/EditorStore";
import type { SaveStatusStore } from "../application/SaveStatusStore";
import type { SchemaStore } from "../application/SchemaStore";
import type { SituationPlanStore } from "../application/SituationPlanStore";
import { EditorApp } from "./App";

export interface EditorAppMountOptions {
  readonly propertiesMountElement?: HTMLElement | null;
  readonly saveStatusStore?: SaveStatusStore | null;
  readonly statusBarMountElement?: HTMLElement | null;
  readonly zoomTargetElement?: HTMLElement | null;
  readonly situationPlanStore?: SituationPlanStore | null;
  readonly situationPlanControlsMountElement?: HTMLElement | null;
  readonly onSituationPlanMutation?: (historyKey?: string) => void;
}

export function mountEditorApp(
  element: HTMLElement,
  schemaStore: SchemaStore,
  editorStore: EditorStore,
  hierarchyMountElement: HTMLElement | null,
  options: EditorAppMountOptions = {},
): Root {
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <EditorApp
        schemaStore={schemaStore}
        editorStore={editorStore}
        hierarchyMountElement={hierarchyMountElement}
        propertiesMountElement={options.propertiesMountElement ?? null}
        saveStatusStore={options.saveStatusStore ?? null}
        statusBarMountElement={options.statusBarMountElement ?? null}
        zoomTargetElement={options.zoomTargetElement ?? null}
        situationPlanStore={options.situationPlanStore ?? null}
        situationPlanControlsMountElement={options.situationPlanControlsMountElement ?? null}
        onSituationPlanMutation={options.onSituationPlanMutation}
      />
    </StrictMode>,
  );
  return root;
}
