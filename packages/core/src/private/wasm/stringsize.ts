import I32_SIZE from "#wasm/I32_SIZE";
import utf8size from "@rcompat/string/utf8size";

const stringSize = (string: string) => utf8size(string) + I32_SIZE;

export default stringSize;
