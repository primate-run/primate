import I32_SIZE from "#wasm/I32_SIZE";
import utf8 from "@rcompat/string/utf8";

export default function stringSize(string: string) {
  return utf8.size(string) + I32_SIZE;
}

