import ParseError from "#ParseError";
import is from "@rcompat/is";

export default (x: bigint | number) => {
  if (!is.int(x)) {
    throw new ParseError([{
      input: x,
      message: `${x} is not an integer`,
      path: "",
    }]);
  }
};
