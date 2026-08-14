import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_ZOOM_PERCENT,
  MAX_ZOOM_PERCENT,
  MIN_ZOOM_PERCENT,
  type EditorStore,
} from "../../application/EditorStore";
import type { SaveStatusSnapshot, SaveStatusStore } from "../../application/SaveStatusStore";
import type { SchemaStore } from "../../application/SchemaStore";
import { useEditorSnapshot } from "../useEditorSnapshot";
import { useSchemaSnapshot } from "../useSchemaSnapshot";

const ZOOM_STEP = 25;

interface StatusBarProps {
  readonly schemaStore: SchemaStore;
  readonly editorStore: EditorStore;
  readonly saveStatusStore: SaveStatusStore;
  readonly zoomTargetElement?: HTMLElement | null;
}

function useSaveStatus(store: SaveStatusStore): SaveStatusSnapshot {
  const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store]);
  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function StatusBar({
  schemaStore,
  editorStore,
  saveStatusStore,
  zoomTargetElement = null,
}: StatusBarProps) {
  const schemaSnapshot = useSchemaSnapshot(schemaStore);
  const editorSnapshot = useEditorSnapshot(editorStore);
  const saveStatus = useSaveStatus(saveStatusStore);
  const activeBoard = schemaSnapshot.document.getBoard(editorSnapshot.activeBoardId);
  const selectedItem = editorSnapshot.selectedItemId === null
    ? undefined
    : schemaSnapshot.document.getItem(editorSnapshot.selectedItemId);
  const zoomPercent = editorSnapshot.zoomPercent;

  useEffect(() => {
    if (zoomTargetElement === null) return;
    zoomTargetElement.style.setProperty("zoom", `${zoomPercent}%`);
    return () => {
      zoomTargetElement.style.removeProperty("zoom");
    };
  }, [zoomTargetElement, zoomPercent]);

  return (
    <footer className="react-statusbar" aria-label="Statusbalk van de editor">
      <span className="react-statusbar__section">
        {activeBoard ? `Bord: ${activeBoard.name}` : null}
        {selectedItem ? ` — ${selectedItem.label}` : null}
      </span>
      <span
        className={saveStatus.hasUnsavedChanges
          ? "react-statusbar__save react-statusbar__save--dirty"
          : "react-statusbar__save"}
        role="status"
      >
        {saveStatus.hasUnsavedChanges
          ? `Niet opgeslagen wijzigingen in ${saveStatus.filename}`
          : `${saveStatus.filename} is opgeslagen`}
      </span>
      <span className="react-statusbar__zoom" aria-label="Zoomniveau van de tekening">
        <button
          type="button"
          aria-label="Uitzoomen"
          disabled={zoomPercent <= MIN_ZOOM_PERCENT}
          onClick={() => editorStore.commands.setZoomPercent(zoomPercent - ZOOM_STEP)}
        >−</button>
        <button
          type="button"
          aria-label="Zoom terugzetten naar 100 procent"
          onClick={() => editorStore.commands.setZoomPercent(DEFAULT_ZOOM_PERCENT)}
        >{zoomPercent}%</button>
        <button
          type="button"
          aria-label="Inzoomen"
          disabled={zoomPercent >= MAX_ZOOM_PERCENT}
          onClick={() => editorStore.commands.setZoomPercent(zoomPercent + ZOOM_STEP)}
        >+</button>
      </span>
    </footer>
  );
}
