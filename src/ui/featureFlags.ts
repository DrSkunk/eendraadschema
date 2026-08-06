export function reactEditorShellEnabled(search: string): boolean {
  return new URLSearchParams(search).get("reactShell") !== "off";
}
