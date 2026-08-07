import type { ConfiguredItemProperties } from "../../../application/ConfiguredItemProperties";

export interface ConfiguredEditorField {
  readonly key: string;
  readonly label: string;
  readonly advanced?: boolean;
  readonly visible?: (properties: ConfiguredItemProperties) => boolean;
}

export interface ConfiguredItemEditorConfig {
  readonly fields: readonly ConfiguredEditorField[];
}

const numberFields: readonly ConfiguredEditorField[] = [
  { key: "numberMode", label: "Nummering", visible: (properties) => properties.canEditNumber },
  { key: "number", label: "Nummer", visible: (properties) => properties.canEditNumber },
];
const addressField: ConfiguredEditorField = { key: "address", label: "Adres of tekst" };
const textLayoutFields: readonly ConfiguredEditorField[] = [
  { key: "text", label: "Tekst (nieuwe lijn = |)" },
  { key: "widthMode", label: "Breedte" },
  { key: "width", label: "Handmatige breedte", visible: (properties) => properties.values.widthMode === "handmatig" },
  { key: "bold", label: "Vet", advanced: true },
  { key: "italic", label: "Cursief", advanced: true },
  { key: "alignment", label: "Horizontale uitlijning", advanced: true },
];

function numbered(fields: readonly ConfiguredEditorField[]): ConfiguredItemEditorConfig {
  return { fields: [...numberFields, ...fields, addressField] };
}

export const configuredItemEditorConfigs: Readonly<Record<string, ConfiguredItemEditorConfig>> = Object.freeze({
  Batterij: numbered([{ key: "symbol", label: "Symbool" }]),
  Boiler: numbered([{ key: "accumulation", label: "Accumulatie" }]),
  Bord: { fields: [
    { key: "name", label: "Naam" },
    { key: "grounded", label: "Geaard" },
  ] },
  Domotica: numbered([{ key: "text", label: "Tekst (nieuwe lijn = |)" }]),
  "Domotica module (verticaal)": { fields: [
    ...numberFields,
    { key: "text", label: "Tekst" },
  ] },
  "Domotica gestuurde verbruiker": numbered([
    { key: "wireless", label: "Draadloos" },
    { key: "localButton", label: "Lokale drukknop" },
    { key: "programmed", label: "Geprogrammeerd" },
    { key: "detection", label: "Detectie" },
    { key: "externalControl", label: "Externe sturing" },
    { key: "externalControlType", label: "Type externe sturing", visible: (properties) => properties.values.externalControl === true },
  ]),
  Drukknop: numbered([
    { key: "buttonType", label: "Type" },
    { key: "fixtureCount", label: "Aantal armaturen" },
    { key: "buttonsPerFixture", label: "Knoppen per armatuur" },
    { key: "indicatorLight", label: "Verklikkerlampje", advanced: true },
    { key: "splashProof", label: "Halfwaterdicht", advanced: true },
    { key: "shielded", label: "Afgeschermd", advanced: true },
  ]),
  Ketel: numbered([
    { key: "boilerType", label: "Type" },
    { key: "energySource", label: "Energiebron" },
    { key: "heatFunction", label: "Warmtefunctie" },
    { key: "count", label: "Aantal" },
  ]),
  Leiding: numbered([
    { key: "cableType", label: "Type kabel" },
    { key: "cableLocation", label: "Plaatsing" },
    { key: "inConduit", label: "In buis", visible: (properties) => properties.values.cableLocation !== "Luchtleiding" },
  ]),
  Media: numbered([
    { key: "symbol", label: "Symbool" },
    { key: "count", label: "Aantal", visible: (properties) => ["luidspreker", "intercom"].includes(String(properties.values.symbol)) },
  ]),
  Omvormer: numbered([
    { key: "text", label: "Tekst" },
    { key: "inCircuit", label: "In kring", advanced: true, visible: (properties) => properties.parentType === "Kring" },
    { key: "micro", label: "Micro-omvormer", advanced: true, visible: (properties) => properties.childCount <= 1 },
  ]),
  Transformator: numbered([{ key: "voltage", label: "Spanning" }]),
  "USB lader": numbered([{ key: "count", label: "Aantal" }]),
  Ventilator: numbered([{ key: "fanType", label: "Type" }]),
  Verbruiker: numbered(textLayoutFields),
  Verlenging: numbered([{ key: "width", label: "Breedte" }]),
  Verwarmingstoestel: numbered([
    { key: "accumulation", label: "Accumulatie" },
    { key: "fan", label: "Ventilator", visible: (properties) => properties.values.accumulation === true },
  ]),
  "Vrije ruimte": { fields: [{ key: "width", label: "Breedte" }] },
  "Vrije tekst": { fields: [
    ...numberFields,
    ...textLayoutFields,
    { key: "frameType", label: "Type" },
    { ...addressField, visible: (properties) => properties.values.frameType !== "zonder kader" },
  ] },
  "Warmtepomp/airco": numbered([
    { key: "heatFunction", label: "Warmtefunctie" },
    { key: "count", label: "Aantal" },
  ]),
  "Zeldzame symbolen": { fields: [
    ...numberFields,
    { key: "symbol", label: "Symbool" },
    { ...addressField, visible: (properties) => properties.values.symbol === "deurslot" },
  ] },
  Zonnepaneel: numbered([
    { key: "count", label: "Aantal" },
    { key: "symbol", label: "Symbool" },
  ]),
  Splitsing: { fields: [] },
});
