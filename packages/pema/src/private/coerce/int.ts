import is from "@rcompat/is";

export default function coerce_int(x: unknown) {
  // normalize from string to number; other types unaffected
  const n = is.numeric(x) ? Number(x) : x;

  // if is integer, return it
  if (is.int(n)) return n;

  return x;
}
