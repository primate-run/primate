import type Validator from "#Validator";
import E from "#errors";

export default function starts_with(prefix: string): Validator<string> {
  return (x: string) => {
    if (!x.startsWith(prefix)) {
      throw E.invalid_format(x, `"${x}" does not start with "${prefix}"`);
    }
  };
}
