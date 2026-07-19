import E from "#errors";
import type Validator from "#Validator";
import message from "#validator/message";
import type MessageOptions from "#validator/MessageOptions";

export default function regex(
  re: RegExp,
  options?: MessageOptions<string>,
): Validator<string> {
  const format = message(options, y => `"${y}" is not a valid ${String(re)}`);

  return (x: string) => {
    if (!re.test(x)) throw E.invalid_format(x, format(x));
  };
};
