import type MessageOptions from "#validator/MessageOptions";
import is from "@rcompat/is";

export default function message<T>(
  options: MessageOptions<T> | undefined,
  fallback: (value: T) => string) {
  const option = is.dict(options) ? options.message : options;

  return (value: T) => typeof option === "function"
    ? option(value)
    : option ?? fallback(value);
}
