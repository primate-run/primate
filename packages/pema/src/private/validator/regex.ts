import type Validator from "#Validator";
import E from "#errors";

type ErrorFunction = (x: string) => string;

export default function regex(
  format: RegExp,
  error?: ErrorFunction): Validator<string> {
  return (x: string) => {
    if (!format.test(x)) {
      const message = (error ?? ((y: string) =>
        `"${y}" is not a valid ${String(format)}`))(x);
      throw E.invalid_format(x, message);
    }
  };
};
