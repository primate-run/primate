import assert from "@rcompat/invariant/assert";
import type Offset from "./offset.js";
import type toBufferView from "./to-buffer-view.js";

const SIZE_I64 = BigUint64Array.BYTES_PER_ELEMENT;
type BufferView = ReturnType<typeof toBufferView>;

const decodeBigUint64LE = (offset: Offset, source: BufferView): bigint => {
  const ptr = offset.ptr;
  const next = ptr + SIZE_I64;
  assert(next <= source.byteLength, "Index out of bounds.");
  offset.ptr = next;
  return source.view.getBigUint64(ptr, true);
};

export default decodeBigUint64LE;