import assert from "@rcompat/invariant/assert";
import decodeUint32LE from "./decode-uint32le.js";
import type Offset from "./offset.js";
import type toBufferView from "./to-buffer-view.js";

type BufferView = ReturnType<typeof toBufferView>;

const decodeBytes = (offset: Offset, source: BufferView): Uint8Array => {
  const bytesSize = decodeUint32LE(offset, source);
  
  // pointer math and checks
  const ptr = offset.ptr;
  const next = ptr + bytesSize;
  assert(next <= source.byteLength, "Index out of bounds.");
  offset.ptr = next;
  
  return source.buffer.slice(ptr, next);
}

export default decodeBytes;
