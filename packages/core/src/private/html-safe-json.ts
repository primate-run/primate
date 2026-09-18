import type { Dict } from "@rcompat/type";

const unsafe = /[<>&\u2028\u2029]/g;

const escapes: Dict<string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export default function html_safe_json(value: unknown) {
  return JSON.stringify(value).replace(unsafe, char => escapes[char]);
}
