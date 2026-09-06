// Minimal ambient types for the `fontkit` package, covering only what
// scripts/lib/measureText.ts actually calls. fontkit ships no bundled
// TypeScript types, and this is deliberately a hand-rolled declaration
// rather than the (unofficial, community-maintained) @types/fontkit package
// — two calls' worth of surface area didn't seem worth a second dependency.
// Expand this if measureText.ts starts using more of the API.
declare module "fontkit" {
  export interface Font {
    unitsPerEm: number;
    layout(text: string): { advanceWidth: number };
  }
  export function create(buffer: Buffer): Font;
}
