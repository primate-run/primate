import E from "#errors";
import S from "#schema-errors";
import type Validator from "#Validator";
import is from "@rcompat/is";

type Input = string | unknown[];

export default function length(from: number, to: number): Validator<Input> {
  if (!is.finite(from) || !is.finite(to)) throw S.length_not_finite(from, to);
  if (from < 0 || to < 0) throw S.length_not_positive(from, to);
  if (from > to) throw S.length_from_exceeds_to(from, to);

  return (x: Input) => {
    if (!is.string(x) && !is.array(x)) {
      throw E.invalid_type(x, "string or array");
    }

    if (x.length < from || x.length > to) {
      throw E.out_of_range(x, "length out of range");
    }
  };
};

