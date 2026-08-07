import type { ComponentType } from "react";
import { CircuitPropertiesEditor } from "./CircuitPropertiesEditor";
import type { ItemEditorProps } from "./ItemEditorProps";

export const propertyEditors: Readonly<Record<string, ComponentType<ItemEditorProps>>> = Object.freeze({
  Kring: CircuitPropertiesEditor,
});
