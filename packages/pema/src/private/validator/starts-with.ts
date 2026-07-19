import E from "#errors";
import type Validator from "#Validator";
import message from "#validator/message";
import type MessageOptions from "#validator/MessageOptions";

export default function starts_with(
  prefix: string,
  options?: MessageOptions<string>,
): Validator<string> {
  const format = message(options, x =>
    `"${x}" does not start with "${prefix}"`);

  return (x: string) => {
    if (!x.startsWith(prefix)) throw E.invalid_format(x, format(x));
  };
}
