import numeric from "@rcompat/is/numeric";

export default function coerceInt(x: unknown) {
  if (numeric(x)) {
    return Number(x);
  }
  return x;
}
