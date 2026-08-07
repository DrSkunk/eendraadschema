import { describe, expect, it } from "vitest";
import { propertyEditors } from "../ui/properties/propertyEditors";

const userEditableTypes = [
  "Aansluiting", "Aansluitpunt", "Aardingsonderbreker", "Aftakdoos", "Batterij", "Bel",
  "Boiler", "Bord", "Contactdoos", "Diepvriezer", "Domotica", "Domotica module (verticaal)",
  "Domotica gestuurde verbruiker", "Droogkast", "Drukknop", "Elektriciteitsmeter",
  "Elektrische oven", "EV lader", "Ketel", "Koelkast", "Kookfornuis", "Kring", "Leiding",
  "Lichtcircuit", "Lichtpunt", "Media", "Meerdere verbruikers", "Microgolfoven", "Motor",
  "Omvormer", "Overspanningsbeveiliging", "Schakelaars", "Splitsing", "Stoomoven",
  "Transformator", "USB lader", "Vaatwasmachine", "Ventilator", "Verbruiker", "Verlenging",
  "Verwarmingstoestel", "Vrije ruimte", "Vrije tekst", "Warmtepomp/airco", "Wasmachine",
  "Zekering/differentieel", "Zeldzame symbolen", "Zonnepaneel",
] as const;

describe("React property editor coverage", () => {
  it.each(userEditableTypes)("has an editor for %s", (type) => {
    expect(propertyEditors[type]).toBeDefined();
  });

  it("keeps internal container nodes out of the public editor registry", () => {
    expect(propertyEditors.Container).toBeUndefined();
  });
});
