const types = {
  a: "array",
  b: "boolean",
  bb: "blob",
  bi: "bigint",
  co: "constructor",
  d: "date",
  f: "file",
  i: "int",
  n: "number",
  nl: "null",
  o: "object",
  s: "string",
  sy: "symbol",
  u: "undefined",
  ui: "uint",
  ur: "url",
};

const prefix = (at: string) => at ? `${at}: `: "";

export default (type: keyof typeof types, got: unknown, at = "") =>
  `${prefix(at)}expected ${types[type]}, got \`${got}\` (${typeof got})`;
