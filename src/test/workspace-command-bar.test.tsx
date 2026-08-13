import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LegacyHistoryStatusStore } from "../application/HistoryStatusStore";
import { LocalEditorStore } from "../application/EditorStore";
import { LegacySaveStatusStore } from "../application/SaveStatusStore";
import { LegacySchemaStore } from "../application/LegacySchemaStore";
import { LegacySituationPlanStore } from "../application/LegacySituationPlanStore";
import { LocalWorkspaceStore } from "../application/WorkspaceStore";
import { WorkspaceCommandBar } from "../ui/workspace/WorkspaceCommandBar";
import { loadFixture } from "./helpers";

beforeEach(() => {
  globalThis.SITPLANVIEW_DEFAULT_SCALE = 1;
});

afterEach(() => {
  cleanup();
  delete (globalThis as { structure?: unknown }).structure;
});

function renderCommandBar() {
  const structure = loadFixture("example001.eds");
  globalThis.structure = structure;
  const schemaStore = new LegacySchemaStore(structure);
  const situationPlanStore = new LegacySituationPlanStore(structure);
  const workspaceStore = new LocalWorkspaceStore();
  const onSave = vi.fn();
  const onOpenFile = vi.fn();
  render(
    <WorkspaceCommandBar
      schemaStore={schemaStore}
      editorStore={new LocalEditorStore()}
      situationPlanStore={situationPlanStore}
      workspaceStore={workspaceStore}
      saveStatusStore={new LegacySaveStatusStore(() => ({
        hasUnsavedChanges: true,
        filename: "test.eds",
      }))}
      situationHistoryStore={new LegacyHistoryStatusStore(() => ({
        canUndo: false,
        canRedo: false,
      }))}
      onSituationMutation={() => {}}
      onSituationUndo={() => {}}
      onSituationRedo={() => {}}
      onSave={onSave}
      onOpenFile={onOpenFile}
      onImportBackground={() => {}}
      onAddCustomSymbol={() => {}}
      onDeleteSelection={() => {}}
      onSendBackward={() => {}}
      onBringForward={() => {}}
      onZoomIn={() => {}}
      onZoomOut={() => {}}
      onZoomToFit={() => {}}
    />,
  );
  return { onOpenFile, onSave, situationPlanStore, workspaceStore };
}

describe("WorkspaceCommandBar", () => {
  it("keeps common commands fixed and switches contextual situation actions", () => {
    const { onSave, situationPlanStore, workspaceStore } = renderCommandBar();

    expect(screen.getByRole("button", { name: "Ongedaan" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Plattegrond" })).not.toBeInTheDocument();

    act(() => workspaceStore.commands.selectTab("situation"));
    expect(screen.getByRole("button", { name: "Plattegrond" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verwijder" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /^Pagina$/ }));
    expect(situationPlanStore.getSnapshot()).toMatchObject({ pageCount: 2, activePage: 2 });
  });

  it("enables placement actions when the workspace has a selection", () => {
    const { workspaceStore } = renderCommandBar();
    act(() => {
      workspaceStore.commands.selectTab("situation");
      workspaceStore.commands.selectSituationElement("SP_selected");
    });

    expect(screen.getByRole("button", { name: "Verwijder" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Naar achter" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Naar voor" })).toBeEnabled();
  });
});
