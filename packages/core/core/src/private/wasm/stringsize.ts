import I32_SIZE from "#wasm/I32_SIZE";
import utf8size from "@rcompat/string/utf8size";

export default function stringsize(string: string) {
  return utf8size(string) + I32_SIZE;
}
