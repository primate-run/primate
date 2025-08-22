import type ParsedKey from "#ParsedKey";
import type JSONPointer from "@rcompat/type/JSONPointer";

export default interface ParseOptions {
  coerce?: boolean;
  [ParsedKey]?: JSONPointer;
  partial?: boolean;
};
