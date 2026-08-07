import { useState } from "react";

interface DraftTextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onCommit: (value: string) => void;
  readonly validate?: (value: string) => string | undefined;
  readonly disabled?: boolean;
  readonly inputMode?: "text" | "decimal";
}

export function DraftTextField({
  label,
  value,
  onCommit,
  validate,
  disabled = false,
  inputMode = "text",
}: DraftTextFieldProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string>();

  function commit(): void {
    const validationError = validate?.(draft);
    setError(validationError);
    if (validationError === undefined && draft !== value) onCommit(draft);
  }

  return (
    <label className="react-properties__field">
      <span>{label}</span>
      <input
        aria-invalid={error === undefined ? undefined : true}
        disabled={disabled}
        inputMode={inputMode}
        onBlur={commit}
        onChange={(event) => {
          setDraft(event.target.value);
          if (error !== undefined) setError(validate?.(event.target.value));
        }}
        value={draft}
      />
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}
