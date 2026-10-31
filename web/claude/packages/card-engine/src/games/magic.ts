import type { AssetRef } from "../schema/types.js";

// We're hand-writing this type but of course it has to be consistent with
// the yaml schemas. Validation of deserialized data against this type is
// presently done by validating against the yaml.
// Ideally, we derive this class from the yaml (via code generation) so
// that the yaml is the single source of truth.
export type Card = {
  name: string,
  cost?: string,
  types: string[],
  rules?: string[],
  power?: string,
  toughness?: string,
  flavor?: string,
  art?: AssetRef,
}
