import type ParsedKey from "#ParsedKey";
import type Validator from "#Validator";
import type JSONPointer from "@rcompat/type/JSONPointer";

export default interface ParseOptions<T = unknown> {
  coerce?: boolean;
  [ParsedKey]?: JSONPointer;
  partial?: boolean;
  validators?: Validator<T>[];
};
