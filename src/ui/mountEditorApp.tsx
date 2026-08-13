import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { EditorStore } from "../application/EditorStore";
import type { SaveStatusStore } from "../application/SaveStatusStore";
import type { HistoryStatusStore } from "../application/HistoryStatusStore";
import type { SchemaStore } from "../application/SchemaStore";
import type { SituationPlanStore } from "../application/SituationPlanStore";
import type { SituationPlanAssetService } from "../application/SituationPlanAssetService";
import type { WorkspaceStore, WorkspaceTab } from "../application/WorkspaceStore";
import { EditorApp } from "./App";

export interface EditorAppMountOptions {
  readonly propertiesMountElement?: HTMLElement | null;
  readonly saveStatusStore?: SaveStatusStore | null;
  readonly statusBarMountElement?: HTMLElement | null;
  readonly zoomTargetElement?: HTMLElement | null;
  readonly situationPlanStore?: SituationPlanStore | null;
  readonly onSituationPlanMutation?: (historyKey?: string) => void;
  readonly onSituationPlanZoomIn?: () => void;
  readonly onSituationPlanZoomOut?: () => void;
  readonly onSituationPlanZoomToFit?: () => void;
  readonly onSituationPlanDelete?: () => void;
  readonly onSituationPlanSendBackward?: () => void;
  readonly onSituationPlanBringForward?: () => void;
  readonly workspaceStore?: WorkspaceStore;
  readonly onSelectWorkspaceTab?: (tab: WorkspaceTab) => void;
  readonly canCreateSituationOccurrence?: (itemId: number) => boolean;
  readonly onCreateSituationOccurrence?: (itemId: number) => void;
  readonly onRevealSituationOccurrence?: (occurrenceId: string) => void;
  readonly situationPaperElement?: HTMLElement | null;
  readonly commandBarMountElement?: HTMLElement | null;
  readonly situationHistoryStore?: HistoryStatusStore | null;
  readonly onSituationUndo?: () => void;
  readonly onSituationRedo?: () => void;
  readonly onSave?: () => void;
  readonly onOpenFile?: () => void;
  readonly situationPlanAssetService?: SituationPlanAssetService | null;
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
        onSituationPlanMutation={options.onSituationPlanMutation}
        onSituationPlanZoomIn={options.onSituationPlanZoomIn}
        onSituationPlanZoomOut={options.onSituationPlanZoomOut}
        onSituationPlanZoomToFit={options.onSituationPlanZoomToFit}
        onSituationPlanDelete={options.onSituationPlanDelete}
        onSituationPlanSendBackward={options.onSituationPlanSendBackward}
        onSituationPlanBringForward={options.onSituationPlanBringForward}
        workspaceStore={options.workspaceStore}
        onSelectWorkspaceTab={options.onSelectWorkspaceTab}
        canCreateSituationOccurrence={options.canCreateSituationOccurrence}
        onCreateSituationOccurrence={options.onCreateSituationOccurrence}
        onRevealSituationOccurrence={options.onRevealSituationOccurrence}
        situationPaperElement={options.situationPaperElement ?? null}
        commandBarMountElement={options.commandBarMountElement ?? null}
        situationHistoryStore={options.situationHistoryStore ?? null}
        onSituationUndo={options.onSituationUndo}
        onSituationRedo={options.onSituationRedo}
        onSave={options.onSave}
        onOpenFile={options.onOpenFile}
        situationPlanAssetService={options.situationPlanAssetService ?? null}
      />
    </StrictMode>,
  );
  return root;
}
