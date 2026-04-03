import E from "#errors";
import type Validator from "#Validator";
import is from "@rcompat/is";

export default function range<
  From extends bigint | number,
  To extends From,
>(from: From, to: To): Validator<From> {
  if (!is.finite(from) || !is.finite(to)) {
    throw new TypeError("range(): from and to must be finite numbers");
  }

  return (x: From) => {
    if (!is.number(x) && !is.bigint(x)) {
      throw E.invalid_type(x, "number or bigint");
    }

    if (x < from || x > to) throw E.out_of_range(x, `${x} is out of range`);
  };
};

