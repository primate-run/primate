import ParseError from "#ParseError";
import type Validator from "#Validator";
import type { Dict } from "@rcompat/type";

export default function values<T>(input: Dict<T>): Validator<T> {
  const allowed = Object.values(input).map(v => String(v)).join(", ");

  return (x: T) => {
    if (!Object.values(input).includes(x)) {
      throw new ParseError([{
        input: x,
        message: `"${x}" not in given list of values (${allowed})`,
        path: "",
      }]);
    }
  };
}
