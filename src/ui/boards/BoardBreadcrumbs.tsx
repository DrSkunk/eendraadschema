import type { EditorStore } from "../../application/EditorStore";
import type { SchemaDocumentReader } from "../../application/SchemaDocumentReader";
import type { DistributionBoard } from "../../domain/DistributionBoard";

interface BoardBreadcrumbsProps {
  readonly document: SchemaDocumentReader;
  readonly activeBoardId: string;
  readonly editorStore: EditorStore;
}

/** Feeder chain from the main board down to the active board. */
export function getBoardBreadcrumbTrail(
  document: SchemaDocumentReader,
  activeBoardId: string,
): DistributionBoard[] {
  const trail: DistributionBoard[] = [];
  const visited = new Set<string>();
  let board = document.getBoard(activeBoardId);
  while (board !== undefined && !visited.has(board.id)) {
    trail.unshift(board);
    visited.add(board.id);
    board = board.feeder === undefined ? undefined : document.getBoard(board.feeder.sourceBoardId);
  }
  return trail;
}

export function BoardBreadcrumbs({ document, activeBoardId, editorStore }: BoardBreadcrumbsProps) {
  const trail = getBoardBreadcrumbTrail(document, activeBoardId);
  if (trail.length < 2) return null;

  return (
    <nav className="board-breadcrumbs" aria-label="Voedingspad van het actieve verdeelbord">
      <ol>
        {trail.map((board, index) => (
          <li key={board.id}>
            {index < trail.length - 1 ? (
              <button
                type="button"
                onClick={() => editorStore.commands.selectBoard(
                  board.id,
                  document.getBoard(board.id)?.rootItemIds[0] ?? null,
                )}
              >{board.name}</button>
            ) : (
              <span aria-current="page">{board.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
