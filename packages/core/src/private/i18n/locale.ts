import type { Dict } from "@rcompat/type";

type MessageMap = Dict<string>;

export default function locale<const M extends MessageMap>(messages: M): M {
  return messages;
}
