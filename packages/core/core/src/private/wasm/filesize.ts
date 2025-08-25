import I32_SIZE from "#wasm/I32_SIZE";

export default function filesize(file: File) {
  return file.size + I32_SIZE;
}
