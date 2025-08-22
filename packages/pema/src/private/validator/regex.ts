import ParseError from "#ParseError";
import type Validator from "#Validator";

type ErrorFunction = (x: string) => string;

export default function validateRegex(regex: RegExp, error?: ErrorFunction):
  Validator<string> {
  return (x: string) => {
    if (!regex.test(x)) {
      const message = (error ?? ((y: string) =>
        `"${y}" is not a valid ${String(regex)}`))(x);
      throw new ParseError([{
        input: x,
        message,
        path: "",            // root; the calling type should rebase if needed
      }]);
    }
  };
};
