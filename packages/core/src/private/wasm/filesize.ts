import I32_SIZE from "#wasm/I32_SIZE";
import stringSize from "#wasm/stringsize";

export default function filesize(file: File) {
  return stringSize(file.name)
    + stringSize(file.type)
    + I32_SIZE + file.size;
}
