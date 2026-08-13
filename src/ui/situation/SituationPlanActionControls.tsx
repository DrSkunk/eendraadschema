import { useEffect } from "react";

const LEGACY_ACTION_IDS = [
  "button_Delete",
  "button_edit",
  "sendBack",
  "bringFront",
] as const;

export interface SituationPlanActionControlsProps {
  readonly onDelete: () => void;
  readonly onSendBackward: () => void;
  readonly onBringForward: () => void;
}

export function SituationPlanActionControls({
  onDelete,
  onSendBackward,
  onBringForward,
}: SituationPlanActionControlsProps) {
  useEffect(() => {
    const ribbon = document.getElementById("ribbon");
    if (!ribbon) return;

    const hideLegacyActions = () => {
      for (const id of LEGACY_ACTION_IDS) {
        document.getElementById(id)?.classList.add("hidden");
      }
    };
    const observer = new MutationObserver(hideLegacyActions);
    observer.observe(ribbon, { childList: true, subtree: true });
    hideLegacyActions();

    return () => {
      observer.disconnect();
      for (const id of LEGACY_ACTION_IDS) {
        document.getElementById(id)?.classList.remove("hidden");
      }
    };
  }, []);

  const buttonClass = [
    "flex min-w-16 flex-col items-center justify-center border-0 bg-transparent px-2",
    "font-[inherit] hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
    "focus-visible:outline-blue-700",
  ].join(" ");

  return (
    <section
      className="fixed top-[calc(var(--react-shell-height)+var(--menu-height))] left-80 z-20 flex h-[var(--ribbon-height)] items-stretch bg-neutral-50"
      aria-label="Situatieplan acties"
    >
      <button type="button" className={buttonClass} onClick={onDelete}>
        <span className="text-2xl" aria-hidden="true">🗑</span>
        <span>Verwijder</span>
      </button>
      <button type="button" className={buttonClass} onClick={onSendBackward}>
        <span className="text-2xl" aria-hidden="true">↓↓</span>
        <span>Naar achter</span>
      </button>
      <button type="button" className={buttonClass} onClick={onBringForward}>
        <span className="text-2xl" aria-hidden="true">↑↑</span>
        <span>Naar voor</span>
      </button>
    </section>
  );
}
