import type Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";
import is from "@rcompat/is";

export default function is_parsed(x: unknown): x is Parsed<unknown> {
  return is.object(x) && ParsedKey in x;
};
