import { describe, expect, it } from "vitest";
import { Hierarchical_List } from "../Hierarchical_List";
import { decodeEds, structureFromJson } from "../legacy/persistence/EdsCodec";
import { SituationPlanElement } from "../sitplan/SituationPlanElement";
import { hierarchySnapshot, loadCurrentFixture, loadFixture } from "./helpers";

describe("EDS compatibility", () => {
  it.each([
    ["example_default.eds", 4],
    ["example000.eds", 19],
    ["example001.eds", 31],
  ])("loads legacy fixture %s", (filename, expectedItems) => {
    const structure = loadFixture(filename);

    expect(structure.length).toBe(expectedItems);
    expect(structure.data.every((item) => item.sourcelist === structure)).toBe(true);
    expect(structure.data.every((item) => structure.getElectroItemById(item.id) === item)).toBe(true);
  });

  it("upgrades legacy item names while preserving the hierarchy", () => {
    const structure = loadFixture("example001.eds");
    const types = structure.data.map((item) => item.props.type);

    expect(types).toContain("Contactdoos");
    expect(types).not.toContain("Stopcontact");
    expect(structure.data.some((item) => item.parent !== 0)).toBe(true);
  });

  it("round trips the complete hierarchy, properties, and stable IDs", () => {
    const original = loadFixture("example001.eds");
    const before = hierarchySnapshot(original);
    const serialized = original.toJsonObject(true);
    const reloaded = structureFromJson(serialized, null, 0);

    expect(hierarchySnapshot(reloaded)).toEqual(before);
    expect(reloaded.curid).toBe(original.curid);
    expect(reloaded.properties.filename).toBe(original.properties.filename);
    expect(reloaded.sitplan.toJsonObject()).toEqual(original.sitplan.toJsonObject());
  });

  it("decodes the current uncompressed EDS envelope", () => {
    const original = loadFixture("example_default.eds");
    const text = original.toJsonObject(true);
    const decoded = decodeEds(`TXT0040000${text}`);
    const reloaded = structureFromJson(decoded.text, null, decoded.version);

    expect(decoded.version).toBe(4);
    expect(hierarchySnapshot(reloaded)).toEqual(hierarchySnapshot(original));
  });

  it("preserves less-common types and situation-plan references in version 4 data", () => {
    const original = new Hierarchical_List();
    Object.assign(globalThis, { structure: original, SITPLANVIEW_DEFAULT_SCALE: 0.7 });
    const board = original.addItem("Bord");
    const circuit = original.createItem("Kring");
    original.insertChildAfterId(circuit, board.id);

    for (const type of ["EV lader", "Omvormer", "Overspanningsbeveiliging", "Zeldzame symbolen"]) {
      original.insertChildAfterId(original.createItem(type), circuit.id);
    }

    const linked = new SituationPlanElement();
    linked.setElectroItemId(circuit.id);
    linked.setAdres("auto", "", "rechts");
    original.sitplan.addElement(linked);

    const decoded = decodeEds(`TXT0040000${original.toJsonObject(true)}`);
    const reloaded = structureFromJson(decoded.text, null, decoded.version);

    expect(reloaded.data.map((item) => item.props.type)).toEqual(
      expect.arrayContaining(["EV lader", "Omvormer", "Overspanningsbeveiliging", "Zeldzame symbolen"]),
    );
    expect(reloaded.sitplan.getElements()[0].getElectroItemId()).toBe(circuit.id);
    expect(reloaded.getElectroItemById(circuit.id)?.props.type).toBe("Kring");
  });

  it("loads the checked-in current version fixture", () => {
    const structure = loadCurrentFixture("current-v4-uncommon.eds");

    expect(structure.properties.filename).toBe("current-v4-uncommon.eds");
    expect(structure.data.map((item) => item.props.type)).toEqual([
      "Aansluiting",
      "Bord",
      "Kring",
      "EV lader",
      "Overspanningsbeveiliging",
    ]);
    expect(structure.sitplan.getElements()[0].getElectroItemId()).toBe(4);
  });
});
