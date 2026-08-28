import { describe, expect, it } from "vitest";
import { asAssetRef, asString } from "./fieldHelpers.js";

describe("asString", () => {
  it("passes strings through unchanged", () => {
    expect(asString("hello")).toBe("hello");
  });
  it("stringifies numbers and booleans", () => {
    expect(asString(5)).toBe("5");
    expect(asString(true)).toBe("true");
  });
  it("returns empty string for undefined", () => {
    expect(asString(undefined)).toBe("");
  });
  it("returns empty string for a non-primitive (e.g. an AssetRef used in the wrong field)", () => {
    expect(asString({ assetId: "a1" } as never)).toBe("");
  });
});

describe("asAssetRef", () => {
  it("passes through a valid AssetRef", () => {
    expect(asAssetRef({ assetId: "a1", url: "https://x/y.png" })).toEqual({
      assetId: "a1",
      url: "https://x/y.png",
    });
  });
  it("returns undefined for undefined", () => {
    expect(asAssetRef(undefined)).toBeUndefined();
  });
  it("returns undefined for a string value", () => {
    expect(asAssetRef("not an asset" as never)).toBeUndefined();
  });
  it("returns undefined for an object missing assetId", () => {
    expect(asAssetRef({ url: "x" } as never)).toBeUndefined();
  });
});
