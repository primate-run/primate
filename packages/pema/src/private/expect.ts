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

const prefix = (at: string) => at ? `.${at}: ` : "";

type At = number | string;

function print_got(got: unknown) {
  if (got === undefined) {
    return "undefined";
  }
  if (got === null) {
    return "null";
  }
  return `\`${got}\` (${typeof got})`;
}

export default function expect(type: keyof typeof types, got: unknown, at: At = "") {
  return `${prefix(`${at}`)}expected ${types[type]}, got ${print_got(got)}`;
}
