import ParseError from "#ParseError";
import type Validator from "#Validator";

export default (suffix: string): Validator<string> => (x: string) => {
  if (!x.endsWith(suffix)) {
    throw new ParseError([{
      input: x,
      message: `"${x}" does not end with "${suffix}"`,
      path: "",
    }]);
  }
};
