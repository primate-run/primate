import type Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";

export default function isParsedType(x: unknown): x is Parsed<unknown> {
  return !!x && typeof x === "object" && ParsedKey in x;
};
