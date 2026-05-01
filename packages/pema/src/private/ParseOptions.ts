import type Loose from "#Loose";
import type ParsedKey from "#ParsedKey";
import type Validator from "#Validator";
import type { JSONPointer } from "@rcompat/type";

export default interface ParseOptions<T = unknown> {
  [ParsedKey]?: JSONPointer;
  [Loose]?: boolean;
  partial?: boolean;
  validators?: Validator<T>[];
};
