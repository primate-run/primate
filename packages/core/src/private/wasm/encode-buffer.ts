import assert from "@rcompat/invariant/assert";
import encodeUint32LE from "./encode-uint32le.js";
import type toBufferView from "./to-buffer-view.js";

type BufferView = ReturnType<typeof toBufferView>;

const encodeBuffer = (buffer: Uint8Array, offset: number, bufferView: BufferView) => {
  const byteLength = buffer.byteLength;
  offset = encodeUint32LE(byteLength, offset, bufferView);

  const next = offset + byteLength;
  assert(next <= bufferView.byteLength, "Buffer overflow.");
  bufferView.buffer.set(buffer, offset);

  return next;
};

export default encodeBuffer;