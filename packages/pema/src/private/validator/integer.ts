import ParseError from "#ParseError";
import integer from "@rcompat/is/integer";

export default (x: bigint | number) => {
  if (!integer(x)) {
    throw new ParseError([{
      input: x,
      message: `${x} is not an integer`,
      path: "",
    }]);
  }
};
