import { useEffect } from "react";
import type { EditorStore } from "../../application/EditorStore";
import type { SituationPlanElement } from "../../sitplan/SituationPlanElement";

interface SituationBoxElement extends HTMLElement {
  readonly sitPlanElementRef?: SituationPlanElement;
}

export interface SituationSelectionBridgeProps {
  readonly paperElement: HTMLElement | null;
  readonly editorStore: EditorStore;
}

export function SituationSelectionBridge({
  paperElement,
  editorStore,
}: SituationSelectionBridgeProps) {
  useEffect(() => {
    if (!paperElement) return;

    const selectLinkedElectricalItem = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const box = target.closest(".box") as SituationBoxElement | null;
      const itemId = box?.sitPlanElementRef?.getElectroItemId() ?? null;
      if (itemId !== null) editorStore.commands.selectItem(itemId);
    };
    paperElement.addEventListener("mousedown", selectLinkedElectricalItem);
    paperElement.addEventListener("touchstart", selectLinkedElectricalItem);

    return () => {
      paperElement.removeEventListener("mousedown", selectLinkedElectricalItem);
      paperElement.removeEventListener("touchstart", selectLinkedElectricalItem);
    };
  }, [editorStore, paperElement]);

  return null;
}
