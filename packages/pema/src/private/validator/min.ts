import E from "#errors";
import S from "#schema-errors";
import type Validator from "#Validator";
import message from "#validator/message";
import type MessageOptions from "#validator/MessageOptions";
import is from "@rcompat/is";

type Limit = bigint | number;
type Input = bigint | number | string | unknown[];

export default function min<I extends Input>(
  limit: Limit,
  options?: MessageOptions<I>): Validator<I> {
  const format = message(options, x => {
    if (is.number(x) || is.bigint(x)) return `${x} is lower than ${limit}`;
    return `min ${limit} ${is.string(x) ? "characters" : "items"}`;
  });

  // validate limit once
  if (is.number(limit)) {
    if (!is.finite(limit)) throw S.min_limit_not_finite(limit);

    return (x: unknown) => {
      if (is.number(x)) {
        if (x < limit) throw E.too_small(x, format(x as I));
      } else if (is.string(x) || is.array(x)) {
        if (x.length < limit) {
          throw E.too_small(x, format(x as I));
        }
      } else {
        throw E.invalid_type(x, "number");
      }
    };
  }

  // bigint
  return (x: unknown) => {
    if (is.bigint(x)) {
      if (x < limit) throw E.too_small(x, format(x as I));
    } else {
      throw E.invalid_type(x, "bigint");
    }
  };
}
