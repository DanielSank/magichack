export type {
  AssetRef,
  BooleanFieldDef,
  EnumFieldDef,
  FieldDef,
  FieldType,
  FieldValues,
  GameSchema,
  ImageFieldDef,
  IntegerFieldDef,
  StringFieldDef,
} from "./schema/types.js";
export { GameSchemaParseError, parseGameSchema } from "./schema/load.js";
export type { FieldError, ValidationResult } from "./schema/validate.js";
export { validateFieldValues } from "./schema/validate.js";

export type {
  AutoFit,
  EllipseBox,
  HorizontalAlign,
  ImageBox,
  RasterAssetBox,
  SvgAssetBox,
  RectBox,
  RenderBox,
  RenderContext,
  RenderTree,
  TextBox,
  TextRun,
  VerticalAlign,
} from "./render-tree/types.js";

export type { FontStyle, FontWeight, ToSvgOptions } from "./render/toSvgString.js";
export { toSvgString } from "./render/toSvgString.js";

export type { SymbolDef } from "./symbols/registry.js";
export { findSymbol, symbolsForGame, SYMBOL_REGISTRY } from "./symbols/registry.js";
export { parseInlineSymbols } from "./symbols/parseInlineSymbols.js";

export type { CardData, RenderFn, StyleDef } from "./styles/types.js";
export { findStyle, stylesForGame, STYLE_REGISTRY } from "./registry.js";
