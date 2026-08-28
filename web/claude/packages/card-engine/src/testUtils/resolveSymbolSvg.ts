import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const thisDir = dirname(fileURLToPath(import.meta.url));
// This file lives at src/testUtils/, so the package root is two levels up.
const packageRoot = resolve(thisDir, "../..");

/**
 * Reads a real symbol asset off disk, for tests that want to exercise the
 * actual placeholder SVGs rather than a stub. Not exported from the package
 * (../../index.ts) — this is test-only, Node-fs-based glue, exactly the
 * kind of I/O card-engine itself deliberately avoids.
 */
export function resolveSymbolSvgForTests(svgAssetPath: string): string {
  return readFileSync(join(packageRoot, svgAssetPath), "utf-8");
}
