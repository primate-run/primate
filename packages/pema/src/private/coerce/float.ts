import is from "@rcompat/is";

export default function coerceFloat(x: unknown) {
  const n = is.numeric(x) ? Number(x) : x;
  if (is.number(n)) return n;
  return x;
}
