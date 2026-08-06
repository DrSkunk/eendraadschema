import { describe, expect, it } from "vitest";
import { SVGSymbols } from "../SVGSymbols";
import { loadFixture } from "./helpers";

describe("one-line SVG generation", () => {
  it.each([
    ["example_default.eds", { width: "201", height: "174", uses: 15, lines: 183, texts: 19 }],
    ["example000.eds", { width: "504", height: "567", uses: 48, lines: 244, texts: 65 }],
    ["example001.eds", { width: "630", height: "552", uses: 60, lines: 259, texts: 71 }],
  ])(
    "renders %s as a complete SVG",
    (filename, expectedStructure) => {
      SVGSymbols.clearSymbols();
      const structure = loadFixture(filename);
      const svg = structure.toSVG(0, "horizontal");

      expect(svg.data).toMatch(/^<svg /);
      expect(svg.data).toContain("</svg>");
      expect(svg.xleft + svg.xright).toBeGreaterThan(0);
      expect(svg.yup + svg.ydown).toBeGreaterThan(0);
      expect(svg.data).toContain("<use");

      const document = new DOMParser().parseFromString(svg.data, "image/svg+xml");
      const root = document.documentElement;
      expect({
        width: root.getAttribute("width"),
        height: root.getAttribute("height"),
        uses: document.querySelectorAll("use").length,
        lines: document.querySelectorAll("line").length,
        texts: document.querySelectorAll("text").length,
      }).toEqual(expectedStructure);
    },
  );

  it("keeps meaningful circuit and component structure in the larger fixture", () => {
    SVGSymbols.clearSymbols();
    const structure = loadFixture("example001.eds");
    const svg = structure.toSVG(0, "horizontal").data;

    expect(svg).toContain("#contactdoos");
    expect(svg).toContain("#lamp");
    expect(svg).toMatch(/>A<\/text>/);
  });
});
