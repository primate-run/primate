import integer from "@rcompat/is/integer";
import numeric from "@rcompat/is/numeric";

export default function coerceBigInt(x: unknown) {
  // normalize from string to number; other types unaffected
  const n = numeric(x) ? Number(x) : x;

  // normalize from number to bigint; other types unaffected
  if (integer(n)) {
    return BigInt(n);
  }

  // bigint or invalid
  return x;
}
