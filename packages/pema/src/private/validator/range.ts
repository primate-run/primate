import type Validator from "#Validator";

export default <
  From extends bigint | number,
  To extends From,
>(from: From, to: To): Validator<From> => (x: From) => {
//    console.log("x", x, "from", from, "to", to);
  if (x < from || x > to) {
    throw new Error(`${x} out of range`);
  }
};
