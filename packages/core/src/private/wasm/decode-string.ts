import assert from "@rcompat/invariant/assert";
import decodeUint32LE from "./decode-uint32le.js";
import type Offset from "./offset.js";
import type toBufferView from "./to-buffer-view.js";

type BufferView = ReturnType<typeof toBufferView>;

const decoder = new TextDecoder();
const decodeString = (offset: Offset, source: BufferView): string => {
  const stringSize = decodeUint32LE(offset, source);

  // pointer math and checks
  const ptr = offset.ptr;
  const next = ptr + stringSize;
  assert(next <= source.byteLength, "Index out of bounds.");
  offset.ptr = next;
  
  // get the string using a decoder
  return decoder.decode(source.buffer.subarray(ptr, next));
};

export default decodeString;