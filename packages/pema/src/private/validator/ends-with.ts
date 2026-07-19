import type Validator from "#Validator";
import E from "#errors";
import type MessageOptions from "#validator/MessageOptions";
import message from "#validator/message";

export default function ends_with(
  suffix: string,
  options?: MessageOptions<string>,
): Validator<string> {
  const format = message(options, x => `"${x}" does not end with "${suffix}"`);

  return (x: string) => {
    if (!x.endsWith(suffix)) throw E.invalid_format(x, format(x));
  };
}
