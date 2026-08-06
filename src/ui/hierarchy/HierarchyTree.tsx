import { useMemo, useState } from "react";
import type { EditorStore } from "../../application/EditorStore";
import type { SchemaStore } from "../../application/SchemaStore";
import { useEditorSnapshot } from "../useEditorSnapshot";
import { useSchemaSnapshot } from "../useSchemaSnapshot";
import { AddItemControl } from "./AddItemControl";
import { HierarchyNode } from "./HierarchyNode";
import {
  createHierarchyIndex,
  getEditableChildren,
  getVisibleHierarchy,
} from "./hierarchyModel";

export interface HierarchyTreeProps {
  readonly schemaStore: SchemaStore;
  readonly editorStore: EditorStore;
  readonly confirmDelete?: (label: string) => boolean;
}

function browserConfirmDelete(label: string): boolean {
  return window.confirm(`Wilt u '${label}' en alle onderliggende onderdelen verwijderen?`);
}

export function HierarchyTree({
  schemaStore,
  editorStore,
  confirmDelete = browserConfirmDelete,
}: HierarchyTreeProps) {
  const schemaSnapshot = useSchemaSnapshot(schemaStore);
  const editorSnapshot = useEditorSnapshot(editorStore);
  const [errorMessage, setErrorMessage] = useState("");
  const hierarchyDocument = schemaSnapshot.document;
  const hierarchyIndex = useMemo(
    () => createHierarchyIndex(hierarchyDocument),
    [hierarchyDocument],
  );
  const rootItems = getEditableChildren(hierarchyIndex, null);
  const visibleItemIds = getVisibleHierarchy(
    hierarchyIndex,
    editorSnapshot.expandedItemIds,
  ).map(({ node }) => node.id);
  const rootCapabilities = hierarchyDocument.getRootCapabilities();

  function reconcileEditorState(): void {
    editorStore.commands.reconcileItemIds(new Set(
      schemaStore.getSnapshot().document.getAllItems().map((item) => item.id),
    ));
  }

  function runHistoryCommand(command: () => void): void {
    command();
    reconcileEditorState();
    setErrorMessage("");
  }

  function addRootItem(type: string): void {
    try {
      const itemId = schemaStore.commands.addItem(null, type);
      editorStore.commands.selectItem(itemId);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Het onderdeel kon niet worden toegevoegd.");
    }
  }

  return (
    <nav className="react-hierarchy" aria-labelledby="react-hierarchy-title">
      <header className="react-hierarchy__header">
        <div>
          <span className="react-hierarchy__eyebrow">Document</span>
          <h2 id="react-hierarchy-title">Elektrische hiërarchie</h2>
        </div>
        <AddItemControl
          label="Onderdeel op hoofdniveau toevoegen"
          allowedTypes={rootCapabilities.allowedChildTypes}
          onAdd={addRootItem}
        />
        <div className="react-hierarchy__history" aria-label="Bewerkingsgeschiedenis">
          <button
            type="button"
            disabled={!schemaSnapshot.canUndo}
            onClick={() => runHistoryCommand(schemaStore.commands.undo)}
          >Ongedaan maken</button>
          <button
            type="button"
            disabled={!schemaSnapshot.canRedo}
            onClick={() => runHistoryCommand(schemaStore.commands.redo)}
          >Opnieuw</button>
        </div>
      </header>

      {errorMessage ? <p className="react-hierarchy__error" role="alert">{errorMessage}</p> : null}

      {rootItems.length === 0 ? (
        <p className="react-hierarchy__empty">
          Dit schema bevat nog geen elektrische onderdelen. Voeg hierboven het eerste onderdeel toe.
        </p>
      ) : (
        <ol className="react-hierarchy__tree">
          {rootItems.map((node) => (
            <HierarchyNode
              key={node.id}
              node={node}
              depth={0}
              hierarchyIndex={hierarchyIndex}
              schemaStore={schemaStore}
              editorStore={editorStore}
              selectedItemId={editorSnapshot.selectedItemId}
              expandedItemIds={editorSnapshot.expandedItemIds}
              visibleItemIds={visibleItemIds}
              confirmDelete={confirmDelete}
              reportError={setErrorMessage}
            />
          ))}
        </ol>
      )}
    </nav>
  );
}
