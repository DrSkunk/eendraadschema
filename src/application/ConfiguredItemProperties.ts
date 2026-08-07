export type ConfiguredPropertyValue = string | boolean;

export interface ConfiguredPropertyDefinition {
  readonly legacyKey: string;
  readonly kind: "text" | "boolean" | "select";
  readonly options?: readonly string[];
  readonly defaultValue?: ConfiguredPropertyValue;
}

export interface ConfiguredItemPropertySchema {
  readonly fields: Readonly<Record<string, ConfiguredPropertyDefinition>>;
}

export interface ConfiguredItemProperties {
  readonly itemId: number;
  readonly type: string;
  readonly canEditNumber: boolean;
  readonly parentType: string | null;
  readonly childCount: number;
  readonly values: Readonly<Record<string, ConfiguredPropertyValue>>;
}

export type ConfiguredItemPropertyChanges = Readonly<Record<string, ConfiguredPropertyValue>>;

const numberModes = ["auto", "manueel"] as const;
const cableLocations = ["N/A", "Ondergronds", "Luchtleiding", "In wand", "Op wand"] as const;
const counts10 = Array.from({ length: 10 }, (_, index) => String(index + 1));
const counts20 = Array.from({ length: 20 }, (_, index) => String(index + 1));
const counts40 = Array.from({ length: 40 }, (_, index) => String(index + 1));

const numberFields = {
  numberMode: { legacyKey: "autonr", kind: "select", options: numberModes, defaultValue: "manueel" },
  number: { legacyKey: "nr", kind: "text", defaultValue: "" },
} as const satisfies Readonly<Record<string, ConfiguredPropertyDefinition>>;

const addressField = {
  address: { legacyKey: "adres", kind: "text", defaultValue: "" },
} as const satisfies Readonly<Record<string, ConfiguredPropertyDefinition>>;

function numbered(
  fields: Readonly<Record<string, ConfiguredPropertyDefinition>>,
): ConfiguredItemPropertySchema {
  return Object.freeze({ fields: Object.freeze({ ...numberFields, ...fields, ...addressField }) });
}

function numberedWithoutAddress(
  fields: Readonly<Record<string, ConfiguredPropertyDefinition>>,
): ConfiguredItemPropertySchema {
  return Object.freeze({ fields: Object.freeze({ ...numberFields, ...fields }) });
}

function schema(
  fields: Readonly<Record<string, ConfiguredPropertyDefinition>>,
): ConfiguredItemPropertySchema {
  return Object.freeze({ fields: Object.freeze({ ...fields }) });
}

/**
 * UI-independent allowlist for field-driven legacy items. Keys are stable
 * application names; legacy property names remain an adapter detail.
 */
export const CONFIGURED_ITEM_PROPERTY_SCHEMAS: Readonly<Record<string, ConfiguredItemPropertySchema>> = Object.freeze({
  Batterij: numbered({
    symbol: { legacyKey: "symbool", kind: "select", options: ["standaard", "blokbatterij"], defaultValue: "standaard" },
  }),
  Boiler: numbered({
    accumulation: { legacyKey: "heeft_accumulatie", kind: "boolean", defaultValue: false },
  }),
  Bord: schema({
    name: { legacyKey: "naam", kind: "text", defaultValue: "" },
    grounded: { legacyKey: "is_geaard", kind: "boolean", defaultValue: false },
  }),
  Domotica: numbered({
    text: { legacyKey: "tekst", kind: "text", defaultValue: "Domotica" },
  }),
  "Domotica module (verticaal)": numberedWithoutAddress({
    text: { legacyKey: "tekst", kind: "text", defaultValue: "Domotica" },
  }),
  "Domotica gestuurde verbruiker": numbered({
    wireless: { legacyKey: "is_draadloos", kind: "boolean", defaultValue: true },
    localButton: { legacyKey: "heeft_lokale_drukknop", kind: "boolean", defaultValue: true },
    programmed: { legacyKey: "is_geprogrammeerd", kind: "boolean", defaultValue: true },
    detection: { legacyKey: "heeft_detectie", kind: "boolean", defaultValue: false },
    externalControl: { legacyKey: "heeft_externe_sturing", kind: "boolean", defaultValue: false },
    externalControlType: { legacyKey: "type_externe_sturing", kind: "select", options: ["drukknop", "schakelaar"], defaultValue: "drukknop" },
  }),
  Drukknop: numbered({
    buttonType: { legacyKey: "type_knop", kind: "select", options: ["standaard", "dimmer", "rolluik"], defaultValue: "standaard" },
    indicatorLight: { legacyKey: "heeft_verklikkerlampje", kind: "boolean", defaultValue: false },
    splashProof: { legacyKey: "is_halfwaterdicht", kind: "boolean", defaultValue: false },
    shielded: { legacyKey: "is_afgeschermd", kind: "boolean", defaultValue: false },
    fixtureCount: { legacyKey: "aantal", kind: "select", options: counts20, defaultValue: "1" },
    buttonsPerFixture: { legacyKey: "aantal_knoppen_per_armatuur", kind: "select", options: counts10.slice(0, 8), defaultValue: "1" },
  }),
  Ketel: numbered({
    boilerType: { legacyKey: "keteltype", kind: "select", options: ["", "Met boiler", "Met tapspiraal", "Warmtekrachtkoppeling", "Warmtewisselaar"], defaultValue: "" },
    energySource: { legacyKey: "energiebron", kind: "select", options: ["", "Elektriciteit", "Gas (atmosferisch)", "Gas (ventilator)", "Vaste brandstof", "Vloeibare brandstof"], defaultValue: "" },
    heatFunction: { legacyKey: "warmtefunctie", kind: "select", options: ["", "Koelend", "Verwarmend", "Verwarmend en koelend"], defaultValue: "" },
    count: { legacyKey: "aantal", kind: "select", options: counts20, defaultValue: "1" },
  }),
  Leiding: numbered({
    cableType: { legacyKey: "type_kabel", kind: "text", defaultValue: "XVB Cca 3G2,5" },
    cableLocation: { legacyKey: "kabel_locatie", kind: "select", options: cableLocations, defaultValue: "N/A" },
    inConduit: { legacyKey: "kabel_is_in_buis", kind: "boolean", defaultValue: false },
  }),
  Media: numbered({
    symbol: { legacyKey: "symbool", kind: "select", options: ["", "luidspreker", "intercom"], defaultValue: "" },
    count: { legacyKey: "aantal", kind: "select", options: counts20, defaultValue: "1" },
  }),
  Omvormer: numbered({
    inCircuit: { legacyKey: "inkring", kind: "boolean", defaultValue: false },
    micro: { legacyKey: "micro", kind: "boolean", defaultValue: false },
    text: { legacyKey: "tekst", kind: "text", defaultValue: "" },
  }),
  Transformator: numbered({
    voltage: { legacyKey: "voltage", kind: "text", defaultValue: "230V/24V" },
  }),
  "USB lader": numbered({
    count: { legacyKey: "aantal", kind: "select", options: counts10, defaultValue: "1" },
  }),
  Ventilator: numbered({
    fanType: { legacyKey: "ventilatortype", kind: "select", options: ["ventilator", "afzuigkap"], defaultValue: "ventilator" },
  }),
  Verbruiker: numbered({
    text: { legacyKey: "tekst", kind: "text", defaultValue: "" },
    widthMode: { legacyKey: "heeft_automatische_breedte", kind: "select", options: ["automatisch", "handmatig"], defaultValue: "automatisch" },
    width: { legacyKey: "breedte", kind: "text", defaultValue: "" },
    bold: { legacyKey: "is_vet", kind: "boolean", defaultValue: false },
    italic: { legacyKey: "is_cursief", kind: "boolean", defaultValue: false },
    alignment: { legacyKey: "horizontale_uitlijning", kind: "select", options: ["links", "centreer", "rechts"], defaultValue: "centreer" },
  }),
  Verlenging: numbered({
    width: { legacyKey: "breedte", kind: "text", defaultValue: "40" },
  }),
  Verwarmingstoestel: numbered({
    accumulation: { legacyKey: "heeft_accumulatie", kind: "boolean", defaultValue: false },
    fan: { legacyKey: "heeft_ventilator", kind: "boolean", defaultValue: false },
  }),
  "Vrije ruimte": schema({
    width: { legacyKey: "breedte", kind: "text", defaultValue: "25" },
  }),
  "Vrije tekst": numbered({
    text: { legacyKey: "tekst", kind: "text", defaultValue: "" },
    widthMode: { legacyKey: "heeft_automatische_breedte", kind: "select", options: ["automatisch", "handmatig"], defaultValue: "automatisch" },
    width: { legacyKey: "breedte", kind: "text", defaultValue: "" },
    bold: { legacyKey: "is_vet", kind: "boolean", defaultValue: false },
    italic: { legacyKey: "is_cursief", kind: "boolean", defaultValue: false },
    alignment: { legacyKey: "horizontale_uitlijning", kind: "select", options: ["links", "centreer", "rechts"], defaultValue: "links" },
    frameType: { legacyKey: "vrije_tekst_type", kind: "select", options: ["verbruiker", "zonder kader"], defaultValue: "zonder kader" },
  }),
  "Warmtepomp/airco": numbered({
    heatFunction: { legacyKey: "warmtefunctie", kind: "select", options: ["", "Koelend", "Verwarmend", "Verwarmend en koelend"], defaultValue: "Koelend" },
    count: { legacyKey: "aantal", kind: "select", options: counts20, defaultValue: "1" },
  }),
  "Zeldzame symbolen": numbered({
    symbol: { legacyKey: "symbool", kind: "select", options: ["", "aarding", "deurslot"], defaultValue: "" },
  }),
  Zonnepaneel: numbered({
    count: { legacyKey: "aantal", kind: "select", options: counts40, defaultValue: "1" },
    symbol: { legacyKey: "symbool", kind: "select", options: ["driehoek", "pijltjes"], defaultValue: "driehoek" },
  }),
  Splitsing: schema({}),
});

export const configuredItemTypes: ReadonlySet<string> = new Set(
  Object.keys(CONFIGURED_ITEM_PROPERTY_SCHEMAS),
);
