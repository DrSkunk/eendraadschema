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
    <section
      className="fixed top-[calc(var(--react-shell-height)+var(--menu-height))] left-[62%] z-20 grid h-[var(--ribbon-height)] -translate-x-1/2 grid-cols-2 items-center gap-1 bg-neutral-50 px-3 py-1"
      aria-label="Situatieplan pagina's"
    >
      <label className="text-right text-sm" htmlFor="situation-plan-page">Pagina</label>
      <select
        id="situation-plan-page"
        className="min-w-16"
        value={snapshot.activePage}
        onChange={(event) => selectPage(Number(event.target.value))}
      >
        {Array.from({ length: snapshot.pageCount }, (_, index) => index + 1).map((page) => (
          <option key={page} value={page}>{page}</option>
        ))}
      </select>
      <button
        type="button"
        className="min-h-6"
        disabled={snapshot.activePage !== snapshot.pageCount}
        onClick={addPage}
      >
        Nieuw
      </button>
      <button
        type="button"
        className="min-h-6 bg-red-700 text-white disabled:bg-neutral-300 disabled:text-neutral-500"
        disabled={snapshot.pageCount <= 1}
        onClick={deleteActivePage}
        aria-label={`Pagina ${snapshot.activePage} verwijderen`}
      >
        &#9851;
      </button>
    </section>
  );
}
