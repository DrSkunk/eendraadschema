import type { SituationPlanStore } from "../../application/SituationPlanStore";
import { useSituationPlanSnapshot } from "../useSituationPlanSnapshot";
import "./situation-plan-controls.css";

export interface SituationPlanPageControlsProps {
  readonly store: SituationPlanStore;
  readonly confirmDelete?: (page: number) => boolean;
  readonly onMutation?: (historyKey?: string) => void;
}

export function SituationPlanPageControls({
  store,
  confirmDelete = (page) => window.confirm(`Pagina ${page} volledig verwijderen?`),
  onMutation = () => {},
}: SituationPlanPageControlsProps) {
  const snapshot = useSituationPlanSnapshot(store);

  function deleteActivePage() {
    if (snapshot.pageCount <= 1 || !confirmDelete(snapshot.activePage)) return;
    store.commands.deletePage(snapshot.activePage);
    onMutation();
  }

  function selectPage(page: number) {
    if (page === snapshot.activePage) return;
    store.commands.selectPage(page);
    onMutation("changePage");
  }

  function addPage() {
    store.commands.addPage();
    onMutation();
  }

  return (
    <section className="situation-plan-page-controls" aria-label="Situatieplan pagina's">
      <label htmlFor="situation-plan-page">Pagina</label>
      <select
        id="situation-plan-page"
        value={snapshot.activePage}
        onChange={(event) => selectPage(Number(event.target.value))}
      >
        {Array.from({ length: snapshot.pageCount }, (_, index) => index + 1).map((page) => (
          <option key={page} value={page}>{page}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={snapshot.activePage !== snapshot.pageCount}
        onClick={addPage}
      >
        Nieuw
      </button>
      <button
        type="button"
        className="situation-plan-delete-page"
        disabled={snapshot.pageCount <= 1}
        onClick={deleteActivePage}
        aria-label={`Pagina ${snapshot.activePage} verwijderen`}
      >
        &#9851;
      </button>
    </section>
  );
}
