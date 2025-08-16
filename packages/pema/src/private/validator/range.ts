import ParseError from "#ParseError";
import type Validator from "#Validator";

export default <
  From extends bigint | number,
  To extends From,
>(from: From, to: To): Validator<From> => (x: From) => {
  if (x < from || x > to) {
    throw new ParseError([{
      input: x,
      message: `${x} is out of range`,
    }]);
  }
};
