const types = {
  a: "array",
  b: "boolean",
  d: "date",
  n: "number",
  s: "string",
  u: "undefined",
  bi: "bigint",
  f: "file",
  bb: "blob",
  o: "object",
  nl: "null",
  sy: "symbol",
  ur: "url",
  i: "int",
  ui: "uint",
  co: "constructor",
};

const prefix = (at: string) => at ? `${at}: `: "";

export default (type: keyof typeof types, got: unknown, at = "") =>
  `${prefix(at)}expected ${types[type]}, got \`${got}\` (${typeof got})`;
