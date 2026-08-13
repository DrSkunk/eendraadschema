import { useEffect } from "react";
import type { EditorStore } from "../../application/EditorStore";
import type { WorkspaceStore } from "../../application/WorkspaceStore";
import type { SituationPlanElement } from "../../sitplan/SituationPlanElement";

interface SituationBoxElement extends HTMLElement {
  readonly sitPlanElementRef?: SituationPlanElement;
}

export interface SituationSelectionBridgeProps {
  readonly paperElement: HTMLElement | null;
  readonly editorStore: EditorStore;
  readonly workspaceStore: WorkspaceStore;
}

export function SituationSelectionBridge({
  paperElement,
  editorStore,
  workspaceStore,
}: SituationSelectionBridgeProps) {
  useEffect(() => {
    if (!paperElement) return;

    const syncSelection = (preferredBox: SituationBoxElement | null = null) => {
      const selectedBoxes = Array.from(
        paperElement.querySelectorAll<SituationBoxElement>(".box.selected"),
      );
      if (selectedBoxes.length === 0 && preferredBox?.sitPlanElementRef) {
        selectedBoxes.push(preferredBox);
      }
      const elementIds = selectedBoxes
        .map(box => box.sitPlanElementRef?.id)
        .filter((id): id is string => id !== undefined);
      const currentPrimary = workspaceStore.getSnapshot().selectedSituationElementId;
      const primaryElementId = preferredBox?.sitPlanElementRef?.id
        ?? (currentPrimary !== null && elementIds.includes(currentPrimary) ? currentPrimary : null);
      workspaceStore.commands.selectSituationElements(elementIds, primaryElementId);

      const primary = selectedBoxes.find(box => box.sitPlanElementRef?.id
        === workspaceStore.getSnapshot().selectedSituationElementId);
      const itemId = primary?.sitPlanElementRef?.getElectroItemId() ?? null;
      if (itemId !== null) editorStore.commands.selectItem(itemId);
    };

    const selectLinkedElectricalItem = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const box = target.closest(".box") as SituationBoxElement | null;
      syncSelection(box);
      queueMicrotask(() => syncSelection());
    };
    const observer = new MutationObserver(() => syncSelection());
    observer.observe(paperElement, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
    paperElement.addEventListener("mousedown", selectLinkedElectricalItem);
    paperElement.addEventListener("touchstart", selectLinkedElectricalItem);

    return () => {
      observer.disconnect();
      paperElement.removeEventListener("mousedown", selectLinkedElectricalItem);
      paperElement.removeEventListener("touchstart", selectLinkedElectricalItem);
    };
  }, [editorStore, paperElement, workspaceStore]);

  return null;
}
