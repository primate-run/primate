import type MessageOptions from "#validator/MessageOptions";
import regex from "#validator/regex";

const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export default function email(options?: MessageOptions<string>) {
  return regex(re, options ?? (x => `"${x}" is not a valid email`));
}
