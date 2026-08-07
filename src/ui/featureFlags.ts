export function reactEditorShellEnabled(search: string): boolean {
  return new URLSearchParams(search).get("reactShell") !== "off";
}

export function reactEditorHierarchyEnabled(search: string): boolean {
  return new URLSearchParams(search).get("reactHierarchy") !== "off";
}
