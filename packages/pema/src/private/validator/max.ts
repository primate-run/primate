import E from "#errors";
import S from "#schema-errors";
import type Validator from "#Validator";
import is from "@rcompat/is";

type Limit = bigint | number;
type Input = bigint | number | string | unknown[];

export default function max(limit: Limit): Validator<Input> {
  // validate limit once
  if (is.number(limit)) {
    if (!is.finite(limit)) throw S.max_limit_not_finite(limit);

    return (x: unknown) => {
      if (is.number(x)) {
        if (x > limit) throw E.too_large(x, `${x} is greater than ${limit}`);
      } else if (is.string(x) || is.array(x)) {
        if (x.length > limit) {
          const unit = is.string(x) ? "characters" : "items";
          throw E.too_large(x, `max ${limit} ${unit}`);
        }
      } else {
        throw E.invalid_type(x, "number");
      }
    };
  }

  // bigint
  return (x: unknown) => {
    if (is.bigint(x)) {
      if (x > limit) throw E.too_large(x, `${x} is greater than ${limit}`);
    } else {
      throw E.invalid_type(x, "bigint");
    }
  };
}
