import ValidationError from "#ValidationError";
import type Validator from "#Validator";

export default <
  From extends bigint | number,
  To extends From,
>(from: From, to: To): Validator<From> => (x: From) => {
  if (x < from || x > to) {
    throw new ValidationError([{
      input: x,
      message: `${x} out of range`,
    }]);
  }
};
