import is from "@rcompat/is";

export default function coerceInt(x: unknown) {
  if (is.numeric(x)) return Number(x);
  return x;
}
