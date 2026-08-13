# React migration handoff

Last updated: 13 August 2026

This is the operational memory for continuing the incremental React migration. Read this file first in a future session, then use `current-architecture.md` for the detailed historical inventory.

## Repository and working rules

- Work only in this fork: `drskunk/eendraadschema`.
- Current local branch: `migration/react-foundations`.
- Do not push or open a pull request unless the user explicitly asks.
- The upstream default branch was renamed from `master` to `main`; the GitHub Pages workflow deploys `main`.
- Stage and commit coherent intermediate steps locally.
- Preserve unrelated user changes in a dirty worktree.
- Preserve EDS compatibility, SVG/PDF output, print behavior, undo/redo, local files, browser storage and the situation plan.
- Treat legacy implementation code as frozen. Only change it for EDS backward compatibility or migration fixes required by new persisted features (for example new situation-plan symbols); implement replacement UI and behavior in React/application code.
- Tailwind CSS v4 is integrated through `@tailwindcss/vite` and `css/all.css`; use Tailwind utilities for new React styling instead of adding component CSS where utilities suffice.

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
- Situation-plan page state and defaults are encapsulated by `SituationPlan`; the legacy view now uses typed document operations instead of directly mutating its element array, page count or defaults.
- `LegacySituationPlanStore` exposes immutable, DOM-independent situation-plan snapshots and validated page/default commands. The legacy view receives this store, its page/default controls use commands, and legacy document replacement refreshes the adapter.
- React owns the shared Tailwind workspace command bar. It presents tab-aware undo/redo, save/file actions, situation-plan page management, selection actions and zoom in one consistent surface; superseded standalone situation controls were removed.
- Situation-plan command-bar actions use the existing public canvas boundary while the legacy implementation remains unchanged. React now owns the image file input and Tailwind custom-symbol dialog; `LegacySituationPlanAssetService` imports backgrounds and places situation-only symbols without hidden legacy button clicks.
- The editor now has one unified workspace shell: a permanent electrical hierarchy on the left, a permanent contextual property inspector on the right, and tabbed `Eéndraadschema`/`Situatieschema` canvases in the center. `Bordindeling` is reserved as a disabled future workspace tab for physical panel layout.
- Cross-editor linking is bidirectional. Selecting an electrical hierarchy item shows all linked situation-plan placements and can create or reveal one; selecting a linked situation-plan symbol selects its electrical item in the permanent hierarchy.
- The permanent right inspector is contextual: electrical properties in the one-line tab and placement properties in the situation tab. Situation placements can be edited without a modal for page, coordinates, scale, rotation, label size, address mode/location and lock state.

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
- `src/application/HistoryStatusStore.ts`: reactive history availability adapter used by the situation-plan command bar.
- `src/application/SituationPlanAssetService.ts`: React-facing contracts for background import and situation-only symbols.
- `src/application/LegacySituationPlanAssetService.ts`: transitional implementation over the public situation canvas and authoritative stores.
- `src/domain/DistributionBoard.ts`: persisted board and feeder model plus membership/cycle helpers.
- `src/legacy/persistence/EdsCodec.ts`: EDS decoding and old-document migration.
- `src/ui/hierarchy/HierarchyTree.tsx`: active-board-filtered React hierarchy.
- `src/ui/boards/BoardNavigator.tsx`: board navigation and feeder editing.
- `src/ui/workspace/WorkspaceCommandBar.tsx`: shared tab-aware editing commands.
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

Baseline on 13 August 2026: 36 test files and 280 tests passed. The Vite build still reports expected warnings for non-module Pako/jsPDF/property scripts; it completes successfully.

Playwright end-to-end smoke tests exist in `e2e/smoke.spec.ts` (`npm run test:e2e`, config in `playwright.config.ts`, starts the Vite dev server itself). They cover: example loading into the React editor with live SVG, circuit property editing with SVG update and undo/redo, editor search reveal, secondary-board creation/breadcrumbs/deletion, status-bar zoom, situation-plan page management plus background/custom-symbol creation, and the print page through the print adapter. The first run exposed a real layout bug — the legacy top menu was hidden underneath the ribbon because the legacy absolute offsets did not account for the React shell header; fixed with `--react-shell-height` in `css/styles.css`.

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
3. Done: `LegacyFileService` (`src/application/FileService.ts`) is the React-facing open/save adapter — file state, File System Access open, save/save-as with forced picker when no handle exists, download fallback, manual-autosave bookkeeping, and the deployment upload hook. EDS encoding moved into `encodeEds` in `EdsCodec` (compression with TXT fallback). `exportjson`/`loadClicked` delegate to the shared `fileService` instance; a dismissed file picker no longer logs an error and no longer triggers the export upload hook. The imperative file page (`showFilePage`) still renders its own HTML.
4. In progress: evolve the unified workspace as a complete editing experience rather than migrating isolated buttons. Shared tabs, bidirectional selection, the contextual situation-placement inspector, shared command bar, background import and custom-symbol creation are done. Next improve direct canvas interactions and contextual multi-selection. Keep `WorkspaceTab` extensible for the future physical `Bordindeling` editor.
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
