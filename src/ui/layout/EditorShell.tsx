interface EditorShellProps {
  readonly itemCount: number;
}

function itemCountLabel(itemCount: number): string {
  return itemCount === 1
    ? "1 elektrisch onderdeel"
    : `${itemCount} elektrische onderdelen`;
}

export function EditorShell({ itemCount }: EditorShellProps) {
  return (
    <header className="react-editor-shell">
      <div className="react-editor-shell__title">
        <span className="react-editor-shell__eyebrow">Editor</span>
        <strong>Eéndraadschema</strong>
      </div>
      <p className="react-editor-shell__status" role="status" aria-live="polite">
        {itemCountLabel(itemCount)}
      </p>
    </header>
  );
}
