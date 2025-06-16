import assert from "@rcompat/invariant/assert";
import type Offset from "./offset.js";
import type toBufferView from "./to-buffer-view.js";

const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;
type BufferView = ReturnType<typeof toBufferView>;

const decodeUint32LE = (offset: Offset, source: BufferView): number => {
  const ptr = offset.ptr;
  const next = ptr + SIZE_I32;
  assert(next <= source.byteLength, "Index out of bounds.");
  offset.ptr = next;
  return source.view.getUint32(ptr, true);
};

export default decodeUint32LE;