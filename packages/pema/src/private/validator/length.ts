import fail from "#error/fail";
import schemafail from "#error/schemafail";
import ParseError from "#ParseError";
import type Validator from "#Validator";
import isFinite from "@rcompat/is/finite";

type Input = string | unknown[];

export default function length(from: number, to: number): Validator<Input> {
  if (!isFinite(from) || !isFinite(to)) {
    throw schemafail("length: {0} and {1} must be finite numbers", from, to);
  }
  if (from < 0 || to < 0) {
    throw schemafail("length: {0} and {1} must be positive", from, to);
  }
  if (from > to) {
    throw schemafail("length: {0} must be lower than {1}", from, to);
  }

  return (x: Input) => {
    if (typeof x !== "string" && !Array.isArray(x)) {
      throw fail(x, "invalid type");
    }

    if (x.length < from || x.length > to) {
      throw new ParseError([{
        input: x,
        message: "length out of range",
        path: "",
      }]);
    }
  };
};

