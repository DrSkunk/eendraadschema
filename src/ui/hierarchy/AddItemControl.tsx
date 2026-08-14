import { useState } from "react";

interface AddItemControlProps {
  readonly allowedTypes: readonly string[];
  readonly label: string;
  readonly onAdd: (type: string) => void;
}

export function AddItemControl({ allowedTypes, label, onAdd }: AddItemControlProps) {
  const [selectedType, setSelectedType] = useState(allowedTypes[0] ?? "");
  const currentType = allowedTypes.includes(selectedType) ? selectedType : (allowedTypes[0] ?? "");

  if (allowedTypes.length === 0) return null;

  return (
    <div className="react-hierarchy__add-control">
      <label>
        <span className="react-hierarchy__visually-hidden">{label}</span>
        <select
          aria-label={label}
          value={currentType}
          onChange={(event) => setSelectedType(event.currentTarget.value)}
        >
          {allowedTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
      </label>
      <button type="button" onClick={() => onAdd(currentType)} disabled={currentType === ""}>
        Toevoegen
      </button>
    </div>
  );
}
