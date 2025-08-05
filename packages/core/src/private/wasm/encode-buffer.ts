import type BufferView from "@rcompat/bufferview";

export default function encodeBuffer(buffer: Uint8Array, view: BufferView) {
  const byteLength = buffer.byteLength;
  view.writeU32(byteLength).writeBytes(buffer);
};
