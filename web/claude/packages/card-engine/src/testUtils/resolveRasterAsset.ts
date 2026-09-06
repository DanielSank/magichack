import { readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const thisDir = dirname(fileURLToPath(import.meta.url));
// This file lives at src/testUtils/, so the package root is two levels up.
const packageRoot = resolve(thisDir, "../..");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * Reads a real raster asset off disk and returns a data: URI, for tests that
 * want to exercise real file resolution rather than a stub. Not exported
 * from the package (../../index.ts) — this is test-only, Node-fs-based glue,
 * exactly the kind of I/O card-engine itself deliberately avoids.
 */
export function resolveRasterAssetForTests(rasterAssetPath: string): string {
  const bytes = readFileSync(join(packageRoot, rasterAssetPath));
  const mimeType = MIME_TYPES[extname(rasterAssetPath).toLowerCase()] ?? "application/octet-stream";
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}
