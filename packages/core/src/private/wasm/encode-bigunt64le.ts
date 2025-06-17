import assert from "@rcompat/invariant/assert";
import type toBufferView from "./to-buffer-view.js"

const SIZE_I64 = BigInt64Array.BYTES_PER_ELEMENT;
type BufferView = ReturnType<typeof toBufferView>;

const encodeBigUint64LE = (value: bigint, offset: number, bufferView: BufferView) => {
  const next = offset + SIZE_I64;
  assert(next <= bufferView.byteLength, "Buffer overflow.");
  bufferView.view.setBigUint64(offset, value, true);
  return next;
};

export default encodeBigUint64LE;