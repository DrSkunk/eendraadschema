import { useEffect, useState, type FormEvent } from "react";
import type { SchemaDocumentDetails } from "../../application/SchemaDocumentReader";
import type { SchemaStore } from "../../application/SchemaStore";

interface DocumentDetailsEditorProps {
  readonly details: SchemaDocumentDetails;
  readonly schemaStore: SchemaStore;
  readonly reportError: (message: string) => void;
}

function htmlBreaksToNewlines(value: string): string {
  return value.replace(/<br\s*\/?>/gi, "\n");
}

function newlinesToHtmlBreaks(value: string): string {
  return value.replace(/\r?\n/g, "<br>");
}

export function DocumentDetailsEditor({ details, schemaStore, reportError }: DocumentDetailsEditorProps) {
  const [owner, setOwner] = useState(() => htmlBreaksToNewlines(details.owner));
  const [installer, setInstaller] = useState(() => htmlBreaksToNewlines(details.installer));
  const [control, setControl] = useState(() => htmlBreaksToNewlines(details.control));
  const [info, setInfo] = useState(() => htmlBreaksToNewlines(details.info));

  useEffect(() => {
    setOwner(htmlBreaksToNewlines(details.owner));
    setInstaller(htmlBreaksToNewlines(details.installer));
    setControl(htmlBreaksToNewlines(details.control));
    setInfo(htmlBreaksToNewlines(details.info));
  }, [details.owner, details.installer, details.control, details.info]);

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    try {
      schemaStore.commands.updateDocumentDetails({
        owner: newlinesToHtmlBreaks(owner),
        installer: newlinesToHtmlBreaks(installer),
        control: newlinesToHtmlBreaks(control),
        info: newlinesToHtmlBreaks(info),
      });
      reportError("");
    } catch (error) {
      reportError(error instanceof Error ? error.message : "De documentgegevens konden niet worden opgeslagen.");
    }
  }

  return (
    <details className="board-navigator__document">
      <summary>Documentgegevens</summary>
      <form onSubmit={save}>
        <label>Plaats van de elektrische installatie<textarea rows={5} value={owner} onChange={(event) => setOwner(event.target.value)} /></label>
        <label>Installateur<textarea rows={3} value={installer} onChange={(event) => setInstaller(event.target.value)} /></label>
        <label>Erkend organisme (keuring)<textarea rows={3} value={control} onChange={(event) => setControl(event.target.value)} /></label>
        <label>Info<textarea rows={2} value={info} onChange={(event) => setInfo(event.target.value)} /></label>
        <button type="submit">Documentgegevens opslaan</button>
      </form>
    </details>
  );
}
