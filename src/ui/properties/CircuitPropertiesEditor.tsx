import type { CircuitProperties, CircuitPropertyChanges } from "../../application/SchemaPropertyReader";
import type { ItemEditorProps } from "./ItemEditorProps";
import { DraftTextField } from "./DraftTextField";

const protectionOptions = [
  ["automatisch", "Automaat"],
  ["differentieel", "Differentieel"],
  ["differentieelautomaat", "Differentieelautomaat"],
  ["smelt", "Smeltzekering"],
  ["geen", "Geen bescherming"],
  ["contact", "Contact"],
  ["zekeringscheider", "Zekeringscheider"],
  ["relais", "Relais"],
  ["schemer", "Schemerschakelaar"],
  ["overspanningsbeveiliging", "Overspanningsbeveiliging"],
] as const;

function optionalPositiveNumber(value: string): string | undefined {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0
    ? undefined
    : "Gebruik een positief getal of laat dit veld leeg.";
}

interface SelectFieldProps {
  readonly label: string;
  readonly value: string;
  readonly options: ReadonlyArray<readonly [string, string]>;
  readonly onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="react-properties__field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

interface CheckboxFieldProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="react-properties__checkbox">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

export function CircuitPropertiesEditor({ itemId, schemaStore }: ItemEditorProps) {
  const properties = schemaStore.getSnapshot().properties.getCircuit(itemId);
  if (properties === undefined) return null;

  function update(changes: CircuitPropertyChanges): void {
    schemaStore.commands.updateCircuit(itemId, changes);
  }

  const showsPolesAndAmperage = !["geen", "relais"].includes(properties.protection);
  const showsDifferential = ["differentieel", "differentieelautomaat"].includes(properties.protection);
  const showsCurve = ["automatisch", "differentieelautomaat"].includes(properties.protection);
  const showsPhase = ["automatisch", "differentieel", "differentieelautomaat", "smelt"].includes(properties.protection);
  const showsShortCircuit = ["automatisch", "differentieel", "differentieelautomaat"].includes(properties.protection);

  return (
    <form className="react-properties__form" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend>Kring</legend>
        <SelectField
          label="Naamgeving"
          value={properties.nameMode}
          options={[["auto", "Automatisch"], ["manueel", "Manueel"]]}
          onChange={(nameMode) => update({ nameMode })}
        />
        <DraftTextField
          key={`name:${properties.name}`}
          label="Naam"
          value={properties.name}
          disabled={properties.nameMode === "auto"}
          onCommit={(name) => update({ name })}
        />
        <SelectField
          label="Bescherming"
          value={properties.protection}
          options={protectionOptions}
          onChange={(protection) => update({ protection })}
        />
        {showsPolesAndAmperage ? (
          <div className="react-properties__row">
            <SelectField
              label="Aantal polen"
              value={properties.poleCount}
              options={[["2", "2"], ["3", "3"], ["4", "4"], ["-", "−"], ["1", "1"], ["", "Niet opgegeven"]]}
              onChange={(poleCount) => update({ poleCount })}
            />
            <DraftTextField
              key={`amperage:${properties.amperage}`}
              label="Stroom (A)"
              value={properties.amperage}
              inputMode="decimal"
              validate={optionalPositiveNumber}
              onCommit={(amperage) => update({ amperage })}
            />
          </div>
        ) : null}
        {showsDifferential ? (
          <div className="react-properties__row">
            <DraftTextField
              key={`differential:${properties.differentialCurrent}`}
              label="Differentieelstroom (mA)"
              value={properties.differentialCurrent}
              inputMode="decimal"
              validate={optionalPositiveNumber}
              onCommit={(differentialCurrent) => update({ differentialCurrent })}
            />
            <SelectField
              label="Type differentieel"
              value={properties.differentialType}
              options={[["", "Niet opgegeven"], ["A", "A"], ["B", "B"]]}
              onChange={(differentialType) => update({ differentialType })}
            />
          </div>
        ) : null}
        {showsCurve ? (
          <SelectField
            label="Curve automaat"
            value={properties.breakerCurve}
            options={[["", "Niet opgegeven"], ["B", "B"], ["C", "C"], ["D", "D"], ["U", "U"]]}
            onChange={(breakerCurve) => update({ breakerCurve })}
          />
        ) : null}
        {showsShortCircuit ? (
          <DraftTextField
            key={`short-circuit:${properties.shortCircuitRating}`}
            label="Kortsluitvermogen (kA)"
            value={properties.shortCircuitRating}
            inputMode="decimal"
            validate={optionalPositiveNumber}
            onCommit={(shortCircuitRating) => update({ shortCircuitRating })}
          />
        ) : null}
        {showsDifferential ? (
          <CheckboxField
            label="Selectieve differentieel"
            checked={properties.selectiveDifferential}
            onChange={(selectiveDifferential) => update({ selectiveDifferential })}
          />
        ) : null}
        {showsPhase ? (
          <SelectField
            label="Fase"
            value={properties.phase}
            options={[["", "Niet opgegeven"], ["L1", "L1"], ["L2", "L2"], ["L3", "L3"]]}
            onChange={(phase) => update({ phase })}
          />
        ) : null}
        {["contact", "zekeringscheider"].includes(properties.protection) ? (
          <CheckboxField
            label="Normaal gesloten"
            checked={properties.normallyClosed}
            onChange={(normallyClosed) => update({ normallyClosed })}
          />
        ) : null}
        {properties.protection === "contact" ? (
          <SelectField
            label="Sturing"
            value={properties.control}
            options={[["", "Geen"], ["spoel", "Spoel"]]}
            onChange={(control) => update({ control })}
          />
        ) : null}
      </fieldset>

      <fieldset>
        <legend>Voedingskabel</legend>
        <CheckboxField
          label="Kabel aanwezig"
          checked={properties.hasCable}
          onChange={(hasCable) => update({ hasCable })}
        />
        {properties.hasCable ? (
          <>
            <DraftTextField
              key={`cable:${properties.cableType}`}
              label="Kabeltype"
              value={properties.cableType}
              onCommit={(cableType) => update({ cableType })}
            />
            <SelectField
              label="Plaatsing"
              value={properties.cableLocation}
              options={[["N/A", "Niet opgegeven"], ["Ondergronds", "Ondergronds"], ["Luchtleiding", "Luchtleiding"], ["In wand", "In wand"], ["Op wand", "Op wand"]]}
              onChange={(cableLocation) => update({ cableLocation })}
            />
            {properties.cableLocation !== "Luchtleiding" ? (
              <CheckboxField
                label="In buis"
                checked={properties.cableInConduit}
                onChange={(cableInConduit) => update({ cableInConduit })}
              />
            ) : null}
          </>
        ) : null}
      </fieldset>

      <details className="react-properties__advanced">
        <summary>Geavanceerde instellingen</summary>
        {properties.shortCircuitRating !== "" && showsShortCircuit ? (
          <CheckboxField
            label="Huishoudelijke installatie"
            checked={properties.residential}
            onChange={(residential) => update({ residential })}
          />
        ) : null}
        <DraftTextField
          key={`text:${properties.text}`}
          label="Tekst"
          value={properties.text}
          onCommit={(text) => update({ text })}
        />
        <DraftTextField
          key={`address:${properties.address}`}
          label="Adres"
          value={properties.address}
          onCommit={(address) => update({ address })}
        />
        {properties.canStartNewPage ? (
          <CheckboxField
            label="Start op nieuwe pagina"
            checked={properties.startsNewPage}
            onChange={(startsNewPage) => update({ startsNewPage })}
          />
        ) : null}
      </details>
    </form>
  );
}
