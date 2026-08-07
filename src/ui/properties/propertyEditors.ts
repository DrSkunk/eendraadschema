import type { ComponentType } from "react";
import { CircuitPropertiesEditor } from "./CircuitPropertiesEditor";
import { SocketPropertiesEditor } from "./socket/SocketPropertiesEditor";
import { BASIC_CONSUMER_TYPES } from "../../application/SchemaPropertyReader";
import { BasicConsumerPropertiesEditor } from "./basic/BasicConsumerPropertiesEditor";
import type { ItemEditorProps } from "./ItemEditorProps";

const basicConsumerEditors = Object.fromEntries(
  BASIC_CONSUMER_TYPES.map((type) => [type, BasicConsumerPropertiesEditor]),
) as Record<string, ComponentType<ItemEditorProps>>;

export const propertyEditors: Readonly<Record<string, ComponentType<ItemEditorProps>>> = Object.freeze({
  ...basicConsumerEditors,
  Kring: CircuitPropertiesEditor,
  Contactdoos: SocketPropertiesEditor,
});
