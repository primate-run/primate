import ParseError from "#ParseError";
import type Validator from "#Validator";
import isFinite from "@rcompat/is/finite";

const fail = (input: unknown, msg: string) =>
  new ParseError([{ input, message: msg, path: "" }]);

export default function range<
  From extends bigint | number,
  To extends From,
>(from: From, to: To): Validator<From> {
  if (!isFinite(from) || !isFinite(to)) {
    throw new TypeError("range(): from and to must be finite numbers");
  }

  return (x: From) => {
    if (typeof x !== "number" && typeof x !== "bigint") {
      throw fail(x, "invalid type");
    }

    if (x < from || x > to) {
      throw new ParseError([{
        input: x,
        message: `${x} is out of range`,
        path: "",
      }]);
    }
  };
};

