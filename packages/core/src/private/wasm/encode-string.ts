import * as assert from "node:assert/strict";
import utf8ByteLength from "./utf8-byte-length.js";
import encodeUint32LE from "./encode-uint32le.js";
import type toBufferView from "./to-buffer-view.js";
const encoder = new TextEncoder();
type BufferView = ReturnType<typeof toBufferView>;

/**
 * Encoding a string has the following format:
 * - I32: length
 * - U8[length]: bytes
 * 
 * @param str - The string to encode
 * @param offset - The offset to encode the string at.
 * @param bufferView - The buffer view to encode the string into.
 * @returns The next offset.
 */
const encodeString = (str: string, offset: number, bufferView: BufferView) => {
  const byteLength = utf8ByteLength(str);
  offset = encodeUint32LE(byteLength, offset, bufferView);
  const next = offset + byteLength;
  assert.ok(next <= bufferView.byteLength, "Buffer overflow.");
  encoder.encodeInto(str, bufferView.buffer.subarray(offset, offset + byteLength));
  return next;
}

export default encodeString;