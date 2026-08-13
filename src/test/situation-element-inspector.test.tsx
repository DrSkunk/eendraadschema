import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LegacySituationPlanStore } from "../application/LegacySituationPlanStore";
import { LocalWorkspaceStore } from "../application/WorkspaceStore";
import { SituationPlanElement } from "../sitplan/SituationPlanElement";
import { SituationElementInspector } from "../ui/workspace/SituationElementInspector";
import { loadFixture } from "./helpers";

beforeEach(() => {
  globalThis.SITPLANVIEW_DEFAULT_SCALE = 1;
});

afterEach(() => {
  cleanup();
  delete (globalThis as { structure?: unknown }).structure;
});

function createInspectorState() {
  const structure = loadFixture("example001.eds");
  globalThis.structure = structure;
  const element = new SituationPlanElement();
  element.posx = 20;
  element.posy = 30;
  structure.sitplan.addElement(element);
  const situationPlanStore = new LegacySituationPlanStore(structure);
  const workspaceStore = new LocalWorkspaceStore();
  workspaceStore.commands.selectTab("situation");
  workspaceStore.commands.selectSituationElement(element.id);
  return { element, situationPlanStore, workspaceStore };
}

describe("SituationElementInspector", () => {
  it("edits placement geometry and lock state through store commands", () => {
    const { element, situationPlanStore, workspaceStore } = createInspectorState();
    const onMutation = vi.fn();
    render(
      <SituationElementInspector
        situationPlanStore={situationPlanStore}
        workspaceStore={workspaceStore}
        onMutation={onMutation}
      />,
    );

    const rotation = screen.getByLabelText("Rotatie (°)");
    fireEvent.change(rotation, { target: { value: "90" } });
    fireEvent.blur(rotation);
    fireEvent.click(screen.getByLabelText("Vergrendeld"));

    expect(situationPlanStore.getSnapshot().elements[0]).toMatchObject({
      id: element.id,
      rotation: 90,
      movable: false,
    });
    expect(onMutation).toHaveBeenCalledTimes(2);
  });

  it("shows guidance when no placement is selected", () => {
    const { situationPlanStore } = createInspectorState();
    render(
      <SituationElementInspector
        situationPlanStore={situationPlanStore}
        workspaceStore={new LocalWorkspaceStore()}
        onMutation={() => {}}
      />,
    );

    expect(screen.getByText(/Selecteer een symbool/)).toBeInTheDocument();
  });
});
