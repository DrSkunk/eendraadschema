import { createPortal } from "react-dom";
import type { EditorStore } from "../application/EditorStore";
import type { SaveStatusStore } from "../application/SaveStatusStore";
import type { SchemaStore } from "../application/SchemaStore";
import type { SituationPlanStore } from "../application/SituationPlanStore";
import {
  LocalWorkspaceStore,
  type WorkspaceStore,
  type WorkspaceTab,
} from "../application/WorkspaceStore";
import { HierarchyTree } from "./hierarchy/HierarchyTree";
import { StatusBar } from "./layout/StatusBar";
import { ItemPropertiesPanel } from "./properties/ItemPropertiesPanel";
import { useSchemaSnapshot } from "./useSchemaSnapshot";
import { SituationPlanPageControls } from "./situation/SituationPlanPageControls";
import { SituationPlanZoomControls } from "./situation/SituationPlanZoomControls";
import { SituationPlanActionControls } from "./situation/SituationPlanActionControls";
import { WorkspaceHeader } from "./workspace/WorkspaceHeader";
import { SituationSelectionBridge } from "./workspace/SituationSelectionBridge";
import { SituationElementInspector } from "./workspace/SituationElementInspector";
import { useWorkspaceSnapshot } from "./useWorkspaceSnapshot";
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
  readonly situationPlanStore?: SituationPlanStore | null;
  readonly situationPlanControlsMountElement?: HTMLElement | null;
  readonly onSituationPlanMutation?: (historyKey?: string) => void;
  readonly situationPlanZoomMountElement?: HTMLElement | null;
  readonly onSituationPlanZoomIn?: () => void;
  readonly onSituationPlanZoomOut?: () => void;
  readonly onSituationPlanZoomToFit?: () => void;
  readonly situationPlanActionsMountElement?: HTMLElement | null;
  readonly onSituationPlanDelete?: () => void;
  readonly onSituationPlanSendBackward?: () => void;
  readonly onSituationPlanBringForward?: () => void;
  readonly workspaceStore?: WorkspaceStore;
  readonly onSelectWorkspaceTab?: (tab: WorkspaceTab) => void;
  readonly canCreateSituationOccurrence?: (itemId: number) => boolean;
  readonly onCreateSituationOccurrence?: (itemId: number) => void;
  readonly onRevealSituationOccurrence?: (occurrenceId: string) => void;
  readonly situationPaperElement?: HTMLElement | null;
}

export function EditorApp({
  schemaStore,
  editorStore,
  hierarchyMountElement,
  propertiesMountElement = null,
  saveStatusStore = null,
  statusBarMountElement = null,
  zoomTargetElement = null,
  situationPlanStore = null,
  situationPlanControlsMountElement = null,
  onSituationPlanMutation = () => {},
  situationPlanZoomMountElement = null,
  onSituationPlanZoomIn = () => {},
  onSituationPlanZoomOut = () => {},
  onSituationPlanZoomToFit = () => {},
  situationPlanActionsMountElement = null,
  onSituationPlanDelete = () => {},
  onSituationPlanSendBackward = () => {},
  onSituationPlanBringForward = () => {},
  workspaceStore = defaultWorkspaceStore,
  onSelectWorkspaceTab = () => {},
  canCreateSituationOccurrence = () => false,
  onCreateSituationOccurrence = () => {},
  onRevealSituationOccurrence = () => {},
  situationPaperElement = null,
}: EditorAppProps) {
  const snapshot = useSchemaSnapshot(schemaStore);
  const workspace = useWorkspaceSnapshot(workspaceStore);
  const itemCount = snapshot.document
    .getAllItems()
    .filter((item) => item.role === "item").length;

  return (
    <>
      <WorkspaceHeader
        itemCount={itemCount}
        store={workspaceStore}
        onSelectTab={onSelectWorkspaceTab}
      />
      {hierarchyMountElement
        ? createPortal(
            <HierarchyTree
              schemaStore={schemaStore}
              editorStore={editorStore}
              situationPlanStore={situationPlanStore}
              canCreateSituationOccurrence={canCreateSituationOccurrence}
              onCreateSituationOccurrence={onCreateSituationOccurrence}
              onRevealSituationOccurrence={onRevealSituationOccurrence}
            />,
            hierarchyMountElement,
          )
        : null}
      {propertiesMountElement
        ? createPortal(
            workspace.activeTab === "situation" && situationPlanStore
              ? (
                  <SituationElementInspector
                    situationPlanStore={situationPlanStore}
                    workspaceStore={workspaceStore}
                    onMutation={() => onSituationPlanMutation()}
                  />
                )
              : <ItemPropertiesPanel schemaStore={schemaStore} editorStore={editorStore} />,
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
      {situationPlanControlsMountElement && situationPlanStore
        ? createPortal(
            <SituationPlanPageControls
              store={situationPlanStore}
              onMutation={onSituationPlanMutation}
            />,
            situationPlanControlsMountElement,
          )
        : null}
      {situationPlanZoomMountElement
        ? createPortal(
            <SituationPlanZoomControls
              onZoomIn={onSituationPlanZoomIn}
              onZoomOut={onSituationPlanZoomOut}
              onZoomToFit={onSituationPlanZoomToFit}
            />,
            situationPlanZoomMountElement,
          )
        : null}
      {situationPlanActionsMountElement
        ? createPortal(
            <SituationPlanActionControls
              onDelete={onSituationPlanDelete}
              onSendBackward={onSituationPlanSendBackward}
              onBringForward={onSituationPlanBringForward}
            />,
            situationPlanActionsMountElement,
          )
        : null}
      <SituationSelectionBridge
        paperElement={situationPaperElement}
        editorStore={editorStore}
        workspaceStore={workspaceStore}
      />
    </>
  );
}

const defaultWorkspaceStore = new LocalWorkspaceStore();
