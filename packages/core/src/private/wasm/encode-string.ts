import sizeUtf8 from "@rcompat/string/utf8size";
import type BufferView from "@rcompat/bufferview";

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
const encodeString = (str: string, bufferView: BufferView) => {
  const byteLength = sizeUtf8(str);
  bufferView.writeU32(byteLength);
  bufferView.write(str);
}

export default encodeString;
