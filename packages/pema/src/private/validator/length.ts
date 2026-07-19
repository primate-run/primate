import E from "#errors";
import S from "#schema-errors";
import type Validator from "#Validator";
import message from "#validator/message";
import type MessageOptions from "#validator/MessageOptions";
import is from "@rcompat/is";

type Input = string | unknown[];

export default function length<I extends Input>(
  from: number,
  to: number,
  options?: MessageOptions<I>): Validator<I> {
  if (!is.finite(from) || !is.finite(to)) throw S.length_not_finite(from, to);
  if (from < 0 || to < 0) throw S.length_not_positive(from, to);
  if (from > to) throw S.length_from_exceeds_to(from, to);
  const format = message(options, () => "length out of range");

  return (x: I) => {
    if (!is.string(x) && !is.array(x)) {
      throw E.invalid_type(x, "string or array");
    }

    if (x.length < from || x.length > to) throw E.out_of_range(x, format(x));
  };
};
