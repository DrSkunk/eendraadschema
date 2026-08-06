import { inflateSync } from "node:zlib";
import { vi } from "vitest";

Object.assign(globalThis, {
  pako: {
    inflate(input: Uint8Array): Uint8Array {
      return new Uint8Array(inflateSync(input));
    },
  },
});

if (typeof SVGElement !== "undefined") {
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value: vi.fn(function getBBox() {
      const textLength = this.textContent?.length ?? 0;
      return { x: 0, y: 0, width: textLength * 6, height: 10 };
    }),
  });
}
