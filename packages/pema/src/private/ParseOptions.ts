import type ParsedKey from "#ParsedKey";

export default interface ParseOptions {
  coerce?: boolean;
  [ParsedKey]?: string;
  partial?: boolean;
};
