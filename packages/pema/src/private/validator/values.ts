import E from "#errors";
import type Validator from "#Validator";
import type { Dict } from "@rcompat/type";

export default function values<T>(input: Dict<T>): Validator<T> {
  const input_values = Object.values(input);
  const allowed = input_values.map(v => String(v)).join(", ");

  return (x: T) => {
    if (!input_values.includes(x)) {
      throw E.not_in_set(x, `"${x}" not in given list of values (${allowed})`);
    }
  };
}
