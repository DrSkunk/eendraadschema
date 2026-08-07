import { useState, type FormEvent } from "react";
import type { EditorStore } from "../../application/EditorStore";
import type { HierarchyViewNode, SchemaDocumentReader } from "../../application/SchemaDocumentReader";
import type { SchemaStore } from "../../application/SchemaStore";
import type { ValidationIssue } from "../../application/SchemaValidation";

interface BoardNavigatorProps {
  readonly schemaStore: SchemaStore;
  readonly editorStore: EditorStore;
  readonly document: SchemaDocumentReader;
  readonly activeBoardId: string;
  readonly validationIssues: readonly ValidationIssue[];
  readonly reportError: (message: string) => void;
}

export function BoardNavigator({
  schemaStore,
  editorStore,
  document,
  activeBoardId,
  validationIssues,
  reportError,
}: BoardNavigatorProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [feederCircuitId, setFeederCircuitId] = useState("");
  const [cableType, setCableType] = useState("");
  const [conductorSection, setConductorSection] = useState("");
  const [lengthMeters, setLengthMeters] = useState("");
  const boards = document.getBoards();
  const activeBoard = document.getBoard(activeBoardId);
  const circuits = document.getAllItems().filter((item) => item.role === "item" && item.type === "Kring");

  function selectBoard(boardId: string): void {
    const firstRootId = document.getBoard(boardId)?.rootItemIds[0] ?? null;
    editorStore.commands.selectBoard(boardId, firstRootId);
    if (firstRootId !== null) editorStore.commands.expandItem(firstRootId);
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    try {
      const boardId = schemaStore.commands.addDistributionBoard(Number(feederCircuitId), {
        name,
        location,
        cableType,
        conductorSection,
        lengthMeters: lengthMeters === "" ? undefined : Number(lengthMeters),
      });
      const rootItemId = schemaStore.getSnapshot().document.getBoard(boardId)?.rootItemIds[0] ?? null;
      editorStore.commands.selectBoard(boardId, rootItemId);
      if (rootItemId !== null) editorStore.commands.expandItem(rootItemId);
      setName("");
      setLocation("");
      setFeederCircuitId("");
      setCableType("");
      setConductorSection("");
      setLengthMeters("");
      reportError("");
    } catch (error) {
      reportError(error instanceof Error ? error.message : "Het verdeelbord kon niet worden toegevoegd.");
    }
  }

  return (
    <section className="board-navigator" aria-labelledby="board-navigator-title">
      <header className="board-navigator__header">
        <div>
          <span className="react-hierarchy__eyebrow">Document</span>
          <h2 id="board-navigator-title">Verdeelborden</h2>
        </div>
        {validationIssues.length > 0 ? (
          <span className="board-navigator__issue-count" role="status">
            {validationIssues.length} {validationIssues.length === 1 ? "probleem" : "problemen"}
          </span>
        ) : <span className="board-navigator__valid">Geen structurele problemen</span>}
      </header>

      <ol className="board-navigator__list">
        {boards.map((board) => {
          const sourceBoard = board.feeder ? document.getBoard(board.feeder.sourceBoardId) : undefined;
          const sourceCircuit = board.feeder ? document.getItem(board.feeder.sourceCircuitId) : undefined;
          return (
            <li key={board.id}>
              <button
                type="button"
                className={board.id === activeBoardId
                  ? "board-navigator__board board-navigator__board--active"
                  : "board-navigator__board"}
                aria-current={board.id === activeBoardId ? "page" : undefined}
                onClick={() => selectBoard(board.id)}
              >
                <span>▣ {board.name}</span>
                {board.location ? <small>{board.location}</small> : null}
                {board.feeder ? (
                  <small>Gevoed door {sourceBoard?.name ?? "Onbekend bord"} — {sourceCircuit?.label ?? `Kring ${board.feeder.sourceCircuitId}`}</small>
                ) : <small>Hoofdbord</small>}
              </button>
            </li>
          );
        })}
      </ol>

      {activeBoard ? (
        <ActiveBoardEditor
          key={activeBoard.id}
          boardId={activeBoard.id}
          initialName={activeBoard.name}
          initialLocation={activeBoard.location ?? ""}
          initialFeederCircuitId={activeBoard.feeder?.sourceCircuitId}
          initialCableType={activeBoard.feeder?.cableType ?? ""}
          initialConductorSection={activeBoard.feeder?.conductorSection ?? ""}
          initialLengthMeters={activeBoard.feeder?.lengthMeters}
          circuits={circuits}
          document={document}
          schemaStore={schemaStore}
          editorStore={editorStore}
          reportError={reportError}
        />
      ) : null}

      <details className="board-navigator__add">
        <summary>+ Verdeelbord toevoegen</summary>
        <form onSubmit={submit}>
          <label>Naam<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Locatie<input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          <label>Gevoed door
            <select required value={feederCircuitId} onChange={(event) => setFeederCircuitId(event.target.value)}>
              <option value="">Kies een kring</option>
              {circuits.map((circuit) => {
                const board = document.getBoardForItem(circuit.id);
                return <option key={circuit.id} value={circuit.id}>{board?.name ?? "Onbekend bord"} — {circuit.label}</option>;
              })}
            </select>
          </label>
          <label>Voedingskabel<input value={cableType} onChange={(event) => setCableType(event.target.value)} /></label>
          <label>Doorsnede<input value={conductorSection} onChange={(event) => setConductorSection(event.target.value)} /></label>
          <label>Lengte (m)<input min="0" step="any" type="number" value={lengthMeters} onChange={(event) => setLengthMeters(event.target.value)} /></label>
          <button type="submit">Verdeelbord toevoegen</button>
        </form>
      </details>

      {validationIssues.length > 0 ? (
        <details className="board-navigator__validation">
          <summary>Validatie bekijken</summary>
          <ul>
            {validationIssues.map((validationIssue) => (
              <li key={validationIssue.id}>
                <button type="button" onClick={() => {
                  if (validationIssue.boardId) selectBoard(validationIssue.boardId);
                  if (validationIssue.itemId && document.getItem(validationIssue.itemId)) {
                    editorStore.commands.selectItem(validationIssue.itemId);
                  }
                }}>{validationIssue.message}</button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

interface ActiveBoardEditorProps {
  readonly boardId: string;
  readonly initialName: string;
  readonly initialLocation: string;
  readonly initialFeederCircuitId?: number;
  readonly initialCableType: string;
  readonly initialConductorSection: string;
  readonly initialLengthMeters?: number;
  readonly circuits: readonly HierarchyViewNode[];
  readonly document: SchemaDocumentReader;
  readonly schemaStore: SchemaStore;
  readonly editorStore: EditorStore;
  readonly reportError: (message: string) => void;
}

function ActiveBoardEditor({
  boardId,
  initialName,
  initialLocation,
  initialFeederCircuitId,
  initialCableType,
  initialConductorSection,
  initialLengthMeters,
  circuits,
  document,
  schemaStore,
  editorStore,
  reportError,
}: ActiveBoardEditorProps) {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [sourceCircuitId, setSourceCircuitId] = useState(initialFeederCircuitId?.toString() ?? "");
  const [cableType, setCableType] = useState(initialCableType);
  const [conductorSection, setConductorSection] = useState(initialConductorSection);
  const [lengthMeters, setLengthMeters] = useState(initialLengthMeters?.toString() ?? "");
  const isMainBoard = initialFeederCircuitId === undefined;

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    try {
      schemaStore.commands.updateDistributionBoard(boardId, {
        name,
        location,
        sourceCircuitId: isMainBoard ? undefined : Number(sourceCircuitId),
        cableType,
        conductorSection,
        lengthMeters: lengthMeters === "" ? undefined : Number(lengthMeters),
      });
      reportError("");
    } catch (error) {
      reportError(error instanceof Error ? error.message : "Het verdeelbord kon niet worden bijgewerkt.");
    }
  }

  return (
    <details className="board-navigator__edit">
      <summary>Instellingen van {initialName}</summary>
      <form onSubmit={save}>
        <label>Naam<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Locatie<input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
        {!isMainBoard ? (
          <>
            <label>Gevoed door
              <select required value={sourceCircuitId} onChange={(event) => setSourceCircuitId(event.target.value)}>
                {circuits.map((circuit) => {
                  const sourceBoard = document.getBoardForItem(circuit.id);
                  return <option key={circuit.id} value={circuit.id}>{sourceBoard?.name ?? "Onbekend bord"} — {circuit.label}</option>;
                })}
              </select>
            </label>
            <label>Voedingskabel<input value={cableType} onChange={(event) => setCableType(event.target.value)} /></label>
            <label>Doorsnede<input value={conductorSection} onChange={(event) => setConductorSection(event.target.value)} /></label>
            <label>Lengte (m)<input min="0" step="any" type="number" value={lengthMeters} onChange={(event) => setLengthMeters(event.target.value)} /></label>
          </>
        ) : null}
        <button type="submit">Instellingen opslaan</button>
        {!isMainBoard ? (
          <button
            className="board-navigator__delete"
            type="button"
            onClick={() => {
              if (!window.confirm(`Wilt u verdeelbord '${initialName}' en alle inhoud verwijderen?`)) return;
              try {
                schemaStore.commands.deleteDistributionBoard(boardId);
                const fallback = schemaStore.getSnapshot().document.getBoards()[0];
                editorStore.commands.selectBoard(fallback.id, fallback.rootItemIds[0] ?? null);
                reportError("");
              } catch (error) {
                reportError(error instanceof Error ? error.message : "Het verdeelbord kon niet worden verwijderd.");
              }
            }}
          >Verdeelbord verwijderen</button>
        ) : null}
      </form>
    </details>
  );
}
