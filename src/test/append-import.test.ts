// @vitest-environment node

import { describe, expect, it } from "vitest";
import type { DistributionBoard } from "../domain/DistributionBoard";
import { mergeAppendedBoards } from "../importExport/importExport";

const targetBoards: readonly DistributionBoard[] = [
  { id: "main", name: "Hoofdbord", rootItemIds: [1, 2] },
  {
    id: "board-7",
    name: "Garage",
    rootItemIds: [7],
    feeder: { sourceBoardId: "main", sourceCircuitId: 5 },
  },
];

describe("mergeAppendedBoards", () => {
  it("keeps the target boards unchanged when the appended document only has a main board", () => {
    const merged = mergeAppendedBoards(
      targetBoards,
      [{ id: "main", name: "Hoofdbord", rootItemIds: [1] }],
      100,
    );
    expect(merged).toEqual(targetBoards);
  });

  it("remaps secondary board item IDs and feeders by the append offset", () => {
    const appended: DistributionBoard[] = [
      { id: "main", name: "Hoofdbord", rootItemIds: [1] },
      {
        id: "board-4",
        name: "Tuinhuis",
        location: "Tuin",
        rootItemIds: [4],
        feeder: {
          sourceBoardId: "main",
          sourceCircuitId: 3,
          cableType: "XVB",
          conductorSection: "5G6",
          lengthMeters: 12,
        },
      },
    ];

    const merged = mergeAppendedBoards(targetBoards, appended, 100);

    expect(merged.slice(0, 2)).toEqual(targetBoards);
    expect(merged[2]).toEqual({
      id: "board-104",
      name: "Tuinhuis",
      location: "Tuin",
      rootItemIds: [104],
      feeder: {
        sourceBoardId: "main",
        sourceCircuitId: 103,
        cableType: "XVB",
        conductorSection: "5G6",
        lengthMeters: 12,
      },
    });
  });

  it("remaps feeders between appended boards to the regenerated board IDs", () => {
    const appended: DistributionBoard[] = [
      { id: "main", name: "Hoofdbord", rootItemIds: [1] },
      {
        id: "board-4",
        name: "Bijgebouw",
        rootItemIds: [4],
        feeder: { sourceBoardId: "main", sourceCircuitId: 3 },
      },
      {
        id: "board-6",
        name: "Tuinhuis",
        rootItemIds: [6],
        feeder: { sourceBoardId: "board-4", sourceCircuitId: 5 },
      },
    ];

    const merged = mergeAppendedBoards(targetBoards, appended, 100);
    const annex = merged.find((board) => board.name === "Bijgebouw");
    const shed = merged.find((board) => board.name === "Tuinhuis");

    expect(annex?.id).toBe("board-104");
    expect(shed?.feeder?.sourceBoardId).toBe("board-104");
    expect(shed?.feeder?.sourceCircuitId).toBe(105);
  });

  it("generates unique board IDs when the preferred ID is already taken", () => {
    const appended: DistributionBoard[] = [
      { id: "main", name: "Hoofdbord", rootItemIds: [1] },
      {
        id: "board-x",
        name: "Kelder",
        rootItemIds: [7],
        feeder: { sourceBoardId: "main", sourceCircuitId: 3 },
      },
    ];

    // Offset 0 makes the preferred ID "board-7", which the target already uses.
    const merged = mergeAppendedBoards(targetBoards, appended, 0);
    const cellar = merged.find((board) => board.name === "Kelder");

    expect(cellar?.id).toBe("board-7-2");
    expect(new Set(merged.map((board) => board.id)).size).toBe(merged.length);
  });
});
