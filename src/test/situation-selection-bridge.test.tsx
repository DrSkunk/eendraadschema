import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalEditorStore } from "../application/EditorStore";
import { SituationPlanElement } from "../sitplan/SituationPlanElement";
import { SituationSelectionBridge } from "../ui/workspace/SituationSelectionBridge";
import { LocalWorkspaceStore } from "../application/WorkspaceStore";

beforeEach(() => {
  globalThis.SITPLANVIEW_DEFAULT_SCALE = 1;
  (globalThis as { structure?: unknown }).structure = {
    getElectroItemById: (id: number) => id === 42 ? {} : null,
  };
});

afterEach(() => {
  cleanup();
  delete (globalThis as { structure?: unknown }).structure;
});

describe("SituationSelectionBridge", () => {
  it("selects the linked electrical item when its situation symbol is selected", () => {
    const paper = document.createElement("div");
    const box = document.createElement("div") as HTMLDivElement & {
      sitPlanElementRef?: SituationPlanElement;
    };
    const child = document.createElement("span");
    const element = new SituationPlanElement();
    element.setElectroItemId(42);
    box.className = "box selected";
    box.sitPlanElementRef = element;
    box.append(child);
    paper.append(box);

    const editorStore = new LocalEditorStore();
    const workspaceStore = new LocalWorkspaceStore();
    render(
      <SituationSelectionBridge
        paperElement={paper}
        editorStore={editorStore}
        workspaceStore={workspaceStore}
      />,
    );

    fireEvent.mouseDown(child);
    expect(editorStore.getSnapshot().selectedItemId).toBe(42);
    expect(workspaceStore.getSnapshot().selectedSituationElementId).toBe(element.id);
  });

  it("mirrors all selected canvas boxes while retaining the clicked box as primary", () => {
    const paper = document.createElement("div");
    const firstElement = new SituationPlanElement();
    firstElement.setElectroItemId(41);
    const secondElement = new SituationPlanElement();
    secondElement.setElectroItemId(42);
    const firstBox = document.createElement("div") as HTMLDivElement & {
      sitPlanElementRef?: SituationPlanElement;
    };
    const secondBox = document.createElement("div") as HTMLDivElement & {
      sitPlanElementRef?: SituationPlanElement;
    };
    firstBox.className = "box selected";
    secondBox.className = "box selected";
    firstBox.sitPlanElementRef = firstElement;
    secondBox.sitPlanElementRef = secondElement;
    paper.append(firstBox, secondBox);

    const editorStore = new LocalEditorStore();
    const workspaceStore = new LocalWorkspaceStore();
    render(
      <SituationSelectionBridge
        paperElement={paper}
        editorStore={editorStore}
        workspaceStore={workspaceStore}
      />,
    );

    fireEvent.mouseDown(secondBox, { shiftKey: true });

    expect(workspaceStore.getSnapshot()).toMatchObject({
      selectedSituationElementId: secondElement.id,
      selectedSituationElementIds: [firstElement.id, secondElement.id],
    });
    expect(editorStore.getSnapshot().selectedItemId).toBe(42);
  });
});
