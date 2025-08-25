import I32_SIZE from "#wasm/I32_SIZE";

export default function buffersize(buffer: Uint8Array) {
  return buffer.byteLength + I32_SIZE;
}
