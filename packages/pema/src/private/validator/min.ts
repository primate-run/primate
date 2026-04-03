import E from "#errors";
import S from "#schema-errors";
import type Validator from "#Validator";
import is from "@rcompat/is";

type Limit = bigint | number;
type Input = bigint | number | string | unknown[];

export default function min(limit: Limit): Validator<Input> {
  // validate limit once
  if (is.number(limit)) {
    if (!is.finite(limit)) throw S.min_limit_not_finite(limit);

    return (x: unknown) => {
      if (is.number(x)) {
        if (x < limit) throw E.too_small(x, `${x} is lower than ${limit}`);
      } else if (is.string(x) || is.array(x)) {
        if (x.length < limit) {
          const unit = is.string(x) ? "characters" : "items";
          throw E.too_small(x, `min ${limit} ${unit}`);
        }
      } else {
        throw E.invalid_type(x, "number");
      }
    };
  }

  // bigint
  return (x: unknown) => {
    if (is.bigint(x)) {
      if (x < limit) throw E.too_small(x, `${x} is lower than ${limit}`);
    } else {
      throw E.invalid_type(x, "bigint");
    }
  };
}
