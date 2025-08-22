import ParseError from "#ParseError";
import type Validator from "#Validator";

export default (prefix: string): Validator<string> => (x: string) => {
  if (!x.startsWith(prefix)) {
    throw new ParseError([{
      input: x,
      message: `"${x}" does not start with "${prefix}"`,
      path: "",
    }]);
  }
};
