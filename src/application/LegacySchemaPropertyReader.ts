import type { Hierarchical_List } from "../Hierarchical_List";
import type { CircuitProperties, SchemaPropertyReader } from "./SchemaPropertyReader";

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export class LegacySchemaPropertyReader implements SchemaPropertyReader {
  private readonly circuits: ReadonlyMap<number, CircuitProperties>;

  constructor(structure: Hierarchical_List) {
    const firstRootChildId = structure.getFirstChildId(0);
    const circuits = new Map<number, CircuitProperties>();
    for (let ordinal = 0; ordinal < structure.length; ordinal += 1) {
      if (!structure.active[ordinal]) continue;
      const item = structure.getElectroItemById(structure.id[ordinal]);
      if (item === null || item.getType() !== "Kring") continue;
      circuits.set(item.id, Object.freeze({
        itemId: item.id,
        nameMode: text(item.props.autoKringNaam || "auto"),
        name: text(item.props.naam),
        protection: text(item.props.bescherming),
        poleCount: text(item.props.aantal_polen),
        amperage: text(item.props.amperage),
        differentialCurrent: text(item.props.differentieel_delta_amperage),
        differentialType: text(item.props.type_differentieel),
        breakerCurve: text(item.props.curve_automaat),
        shortCircuitRating: text(item.props.kortsluitvermogen),
        selectiveDifferential: item.props.differentieel_is_selectief === true,
        phase: text(item.props.fase),
        normallyClosed: item.props.normaalGesloten === true,
        control: text(item.props.sturing),
        hasCable: item.props.kabel_is_aanwezig === true,
        cableType: text(item.props.type_kabel),
        cableLocation: text(item.props.kabel_locatie),
        cableInConduit: item.props.kabel_is_in_buis === true,
        residential: item.props.huishoudelijk !== false,
        address: text(item.props.adres),
        text: text(item.props.tekst),
        startsNewPage: item.props.newPage === true,
        canStartNewPage: item.parent === 0 && item.id !== firstRootChildId,
      }));
    }
    this.circuits = circuits;
  }

  getCircuit(itemId: number): CircuitProperties | undefined {
    return this.circuits.get(itemId);
  }
}
