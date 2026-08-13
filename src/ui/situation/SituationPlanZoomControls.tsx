export interface SituationPlanZoomControlsProps {
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onZoomToFit: () => void;
}

export function SituationPlanZoomControls({
  onZoomIn,
  onZoomOut,
  onZoomToFit,
}: SituationPlanZoomControlsProps) {
  return (
    <section className="situation-plan-zoom-controls" aria-label="Situatieplan zoom">
      <button type="button" onClick={onZoomIn} aria-label="Inzoomen">
        <span aria-hidden="true">🔍</span>
        <span>In</span>
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Uitzoomen">
        <span aria-hidden="true">🌍</span>
        <span>Uit</span>
      </button>
      <button type="button" onClick={onZoomToFit} aria-label="Schermvullend">
        <span aria-hidden="true">🖥️</span>
        <span>Schermvullend</span>
      </button>
    </section>
  );
}
