# React migration handoff

Last updated: 7 August 2026

This is the operational memory for continuing the incremental React migration. Read this file first in a future session, then use `current-architecture.md` for the detailed historical inventory.

## Repository and working rules

- Work only in this fork: `drskunk/eendraadschema`.
- Current local branch: `migration/react-foundations`.
- Do not push or open a pull request unless the user explicitly asks.
- The upstream default branch was renamed from `master` to `main`; the GitHub Pages workflow deploys `main`.
- Stage and commit coherent intermediate steps locally.
- Preserve unrelated user changes in a dirty worktree.
- Preserve EDS compatibility, SVG/PDF output, print behavior, undo/redo, local files, browser storage and the situation plan.

## Current architectural boundary

```text
React editor UI
  -> SchemaCommands
  -> LegacySchemaStore (single authoritative document + history)
  -> Hierarchical_List and concrete electrical classes
  -> EDS persistence and existing SVG/print renderers

Editor-only state
  -> LocalEditorStore
  -> active board, selection and expanded nodes
```

React must never mutate `Hierarchical_List.data` or an item `props` bag directly. New UI actions go through `SchemaCommands`. The electrical classes must remain free of React, JSX, hooks, DOM elements, CSS names and interactive HTML.

## Completed work

- Regression fixtures and structural tests cover EDS loading, round trips, hierarchy, commands, stable IDs, older files and SVG generation.
- `SchemaDocumentReader` and `SchemaPropertyReader` expose frozen, UI-independent projections.
- `LegacySchemaStore` provides validated commands, subscriptions and snapshot-based undo/redo.
- React owns the one-line editor shell, hierarchy and property panel.
- All public electrical item types have React property editors.
- React is the only interactive one-line editor route. The old feature flags and hierarchy DOM change listener are gone.
- All item `toHTML()` implementations and shared HTML form helpers were removed. Do not reintroduce them.
- EDS005 persists first-class distribution boards; EDS001–EDS004 receive one default `Hoofdbord` when loaded.
- A secondary board is represented by metadata plus a real `Bord` item beneath its feeder `Kring`.
- Board commands cover add, update, feeder changes and delete, and reject duplicate feeders, missing feeders, cycles and silent orphaning.
- Structural validation is independent from React and returns issues with `boardId`/`itemId` navigation targets.
- The React board navigator supports creation, selection, editing, deletion, feeder/cable fields and document details.
- Existing SVG traversal renders secondary boards through their real electrical hierarchy. Board name, location and feeder metadata are added by the existing `Bord` SVG adapter.
- GitHub Pages deployment exists at `.github/workflows/deploy-pages.yml`.
- Append-import (`mergeAppendedBoards` in `src/importExport/importExport.ts`) merges secondary boards from the appended document, remapping item IDs, feeder references and board IDs; the appended main board's items join the target main board.
- `structureFromJson` drops secondary-board root references to items that no longer exist instead of surfacing validation errors on load.
- The item factory uses `ELECTRO_ITEM_CONSTRUCTORS`/`PUBLIC_ELECTRO_ITEM_TYPES` in `src/Hierarchical_List.ts` as the single type registry; the property-editor coverage test derives its type list from it.
- React property editors subscribe through `useSchemaSnapshot`; the board settings form remounts when the stored board values change so undo/redo resets its drafts.

## Important domain invariants

- `Hierarchical_List` remains the sole authoritative electrical document during this migration.
- Item ID `0` is the legacy root sentinel; real item IDs are numeric and must survive save/load.
- Every item belongs to the nearest distribution-board root in its ancestor chain.
- The main board has ID `main`, has no feeder and cannot be deleted or re-fed.
- A secondary board has a stable string ID and references exactly one source board and source `Kring`.
- One circuit can feed at most one secondary board.
- Board feeder connections cannot be cyclic.
- Generic item delete, move, duplicate or type-change commands must not orphan or mutate a board root. Use board commands.
- Board names need not be unique.
- UI selection, active board and expanded nodes are editor state and must not be written to EDS.
- Existing EDS property keys remain a compatibility contract even when React uses semantic property names.
- SVG and print remain legacy renderers until replaced independently with equivalent regression coverage.

## Key files

- `src/application/SchemaStore.ts`: public snapshot and command contracts.
- `src/application/LegacySchemaStore.ts`: command adapter, validation boundaries and history integration.
- `src/application/SchemaDocumentReader.ts`: hierarchy, board and document-detail read contracts.
- `src/application/LegacySchemaDocumentReader.ts`: immutable projection over `Hierarchical_List`.
- `src/application/SchemaPropertyReader.ts`: typed property projections.
- `src/application/SchemaValidation.ts`: React-independent structural validation.
- `src/application/EditorStore.ts`: editor-only selection, expansion and active-board state.
- `src/domain/DistributionBoard.ts`: persisted board and feeder model plus membership/cycle helpers.
- `src/legacy/persistence/EdsCodec.ts`: EDS decoding and old-document migration.
- `src/ui/hierarchy/HierarchyTree.tsx`: active-board-filtered React hierarchy.
- `src/ui/boards/BoardNavigator.tsx`: board navigation and feeder editing.
- `src/ui/document/DocumentDetailsEditor.tsx`: owner, installer, inspection and document info.
- `src/ui/properties/propertyEditors.ts`: registry for React property editors.
- `src/List_Item/Bord.ts`: existing SVG adapter for board export metadata.
- `docs/architecture/current-architecture.md`: original inventory and detailed migration history.

## Verification baseline

Run all of these before committing a migration step:

```sh
npm test -- --run
npm run typecheck:test
npm run build
git diff --check
```

Baseline on 7 August 2026: 22 test files and 228 tests passed. The Vite build still reports expected warnings for non-module Pako/jsPDF/property scripts; it completes successfully.

The embedded browser/Playwright connection could not be used because its MCP request lacked `sandboxPolicy`. The failure occurred before navigation and was not caused by `localhost`. Earlier manual checks confirmed selection, circuit editing, numeric validation, live SVG updates and working undo/redo. Repeat end-to-end browser validation when that browser integration is available.

## Relevant commits

```text
47e7955 feat: persist first-class distribution boards
b8535d7 feat: add distribution board commands and invariants
6443d92 feat: validate distribution board relationships
4d25928 feat: add React distribution board navigation
f63060d feat: include distribution boards in SVG export
8442c03 refactor: make React the only editor renderer
0722924 refactor: remove domain HTML renderers
16172e1 docs: record completed React editor boundaries
```

Earlier React/property-editor commits immediately precede these in branch history. GitHub Pages was added in `f222773`.

## Recommended next sequence

1. Done: editor search (`HierarchySearch` reveals results across boards via `EditorCommands.revealItem`), board breadcrumbs (`BoardBreadcrumbs` renders the feeder chain), save status and zoom (React `StatusBar` at the bottom of the one-line editor; `LegacySaveStatusStore` adapts `AutoSaver` state and is refreshed from schema commands, the autosave callback and a coarse timer; zoom is editor-only state applied as CSS `zoom` on the legacy SVG container). `src/main.ts` is now fully LF with trailing whitespace stripped — keep it that way.
2. Done: `LegacyPrintService` (`src/application/PrintService.ts`) is the React-facing print adapter — layout computation, preview state, display-page clamping, per-page preview SVG (EDS crop or situation-plan page) and PDF generation with explicit parameters. The imperative print page (`src/print/print.ts`) now routes its logic through it while emitting identical DOM; a future React print UI should consume the same `printService` instance exported there. `Print_Table.canPrint()` still reads `globalThis.structure` internally. SVG, pagination and jsPDF generation are unchanged.
3. Move file open/save/save-as UI behind an application service while preserving the File System Access fallback and browser storage.
4. Treat the situation plan as a separate migration: first split its document state from `SituationPlanView`, then migrate UI incrementally.
5. Remove remaining inline handlers only after their React or DOM-listener replacements are tested. Remaining imperative HTML belongs mainly to file/configuration, print and situation-plan screens.
6. Perform manual browser smoke tests with current and old EDS fixtures, a main/garage board document, save/reload, undo/redo, SVG download and PDF print.

## Common pitfalls

- Do not introduce a second copy of the electrical document in React or Zustand.
- Do not infer new Belgian electrical rules when current behavior is unclear; preserve existing behavior.
- Do not refactor the SVG renderer while migrating a UI screen.
- Do not save `Set`-based editor state into EDS.
- Do not identify the main board only as “the first feederless board”; prefer ID `main` and validate malformed documents.
- Do not let deleting an ancestor silently remove a feeder circuit or board root.
- Do not use pixel-perfect SVG snapshots where structural labels, relationships and element counts are sufficient.
- Do not claim browser validation succeeded when only jsdom/RTL tests ran.
