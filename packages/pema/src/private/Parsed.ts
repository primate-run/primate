import CoerceKey from "#CoerceKey";
import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";

export default abstract class Parsed<StaticType> {
  get [ParsedKey]() {
    return "ParsedKey" as const;
  }

  get infer() {
    return undefined as StaticType;
  }

  [CoerceKey](x: unknown) {
    return x;
  }

  abstract get name(): string;

  abstract parse(x: unknown, options?: ParseOptions): StaticType;
}
