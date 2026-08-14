import { useId, useMemo, useState } from "react";
import type { EditorStore } from "../../application/EditorStore";
import type { SchemaDocumentReader } from "../../application/SchemaDocumentReader";
import { searchHierarchyItems, type HierarchySearchResult } from "./hierarchyModel";

const MAX_VISIBLE_RESULTS = 20;

interface HierarchySearchProps {
  readonly document: SchemaDocumentReader;
  readonly editorStore: EditorStore;
}

function focusHierarchyItem(itemId: number): void {
  requestAnimationFrame(() => {
    const row = window.document.querySelector<HTMLButtonElement>(
      `[data-hierarchy-item-id="${itemId}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
    row?.focus();
  });
}

export function HierarchySearch({ document, editorStore }: HierarchySearchProps) {
  const [query, setQuery] = useState("");
  const resultsId = useId();
  const results = useMemo(() => searchHierarchyItems(document, query), [document, query]);
  const visibleResults = results.slice(0, MAX_VISIBLE_RESULTS);
  const hasQuery = query.trim() !== "";

  function reveal(result: HierarchySearchResult): void {
    editorStore.commands.revealItem(result.node.id, result.boardId, result.ancestorItemIds);
    setQuery("");
    focusHierarchyItem(result.node.id);
  }

  return (
    <search className="react-hierarchy-search">
      <label className="react-hierarchy-search__field">
        <span className="react-hierarchy__visually-hidden">Zoeken in het schema</span>
        <input
          type="search"
          placeholder="Zoeken op naam, adres of type…"
          value={query}
          aria-controls={resultsId}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
            if (event.key === "Enter" && visibleResults.length > 0) {
              event.preventDefault();
              reveal(visibleResults[0]);
            }
          }}
        />
      </label>
      {hasQuery ? (
        <div className="react-hierarchy-search__results" id={resultsId}>
          <p role="status" className="react-hierarchy-search__count">
            {results.length === 0
              ? "Geen onderdelen gevonden."
              : `${results.length} ${results.length === 1 ? "onderdeel" : "onderdelen"} gevonden`}
          </p>
          {visibleResults.length > 0 ? (
            <ol>
              {visibleResults.map((result) => (
                <li key={result.node.id}>
                  <button type="button" onClick={() => reveal(result)}>
                    <span>{result.node.label}</span>
                    <small>
                      {result.node.type}
                      {result.boardName ? ` — ${result.boardName}` : ""}
                      {result.node.summary.address ? ` — ${result.node.summary.address}` : ""}
                    </small>
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          {results.length > MAX_VISIBLE_RESULTS ? (
            <p className="react-hierarchy-search__more">
              Enkel de eerste {MAX_VISIBLE_RESULTS} resultaten worden getoond. Verfijn de zoekopdracht.
            </p>
          ) : null}
        </div>
      ) : null}
    </search>
  );
}
