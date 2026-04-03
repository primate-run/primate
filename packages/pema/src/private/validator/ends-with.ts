import type Validator from "#Validator";
import E from "#errors";

export default function ends_with(suffix: string): Validator<string> {
  return (x: string) => {
    if (!x.endsWith(suffix)) {
      throw E.invalid_format(x, `"${x}" does not end with "${suffix}"`);
    }
  };
}
