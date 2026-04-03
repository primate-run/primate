import E from "#errors";
import is from "@rcompat/is";

export default function integer(x: bigint | number) {
  if (!is.int(x)) throw E.invalid_type(x, `${x} is not an integer`);
};
