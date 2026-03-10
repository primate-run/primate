import fail from "#error/fail";
import ParseError from "#ParseError";
import E from "#schema-error";
import type Validator from "#Validator";
import is from "@rcompat/is";

type Input = string | unknown[];

export default function length(from: number, to: number): Validator<Input> {
  if (!is.finite(from) || !is.finite(to)) throw E.length_not_finite(from, to);
  if (from < 0 || to < 0) throw E.length_not_positive(from, to);
  if (from > to) throw E.length_from_exceeds_to(from, to);

  return (x: Input) => {
    if (!is.string(x) && !is.array(x)) throw fail(x, "invalid type");

    if (x.length < from || x.length > to) {
      throw new ParseError([{
        input: x,
        message: "length out of range",
        path: "",
      }]);
    }
  };
};

