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
export { defaultMeasureText, toSvgString } from "./render/toSvgString.js";
export { buildBoxOutlinesOverlay, withBoxOutlinesOverlay } from "./render/boxOutlines.js";

export type { SymbolAsset, SymbolMeta } from "./symbols/registry.js";
export { findSymbolArt, SYMBOL_FONTS } from "./symbols/registry.js";
export { parseInlineSymbols } from "./symbols/parseInlineSymbols.js";

export type { RenderFn, StyleDef } from "./styles/types.js";
export { selectStyle, stylesForGame, STYLE_REGISTRY } from "./registry.js";

export type { CardMap, GameId } from "./games/types.js";
export { isGameId, parseCardData } from "./schema/parseCardData.js";

export type { FontVariant } from "./styles/mtg/fonts/manifest.js";
export { MTG_FONT_VARIANTS } from "./styles/mtg/fonts/manifest.js";

export { findFontVariant, mimeTypeForExtension, mimeTypeForFontExtension, toDataUri } from "./render/resolverHelpers.js";
