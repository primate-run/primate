import * as assert from "node:assert/strict";

import type toBufferView from "./to-buffer-view.js";
const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;
type BufferView = ReturnType<typeof toBufferView>;

/**
 * Encode a single 4 byte integer into a buffer view.
 * 
 * @param value - The value.
 * @param offset - The offset to encode the value at.
 * @param bufferView - The buffer view to encode the value into.
 * @returns - The next offset.
 */
const encodeUint32LE = (value: number, offset: number, bufferView: BufferView) => {
  const next = offset + SIZE_I32;
  assert.ok(next <= bufferView.byteLength, "Buffer overflow.");
  bufferView.view.setUint32(offset, value, true);
  return next;
}

export default encodeUint32LE;