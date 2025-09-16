import type BufferView from "@rcompat/bufferview";
import utf8size from "@rcompat/string/utf8size";

/**
 * Encoding a string has the following format:
 * - I32: length
 * - U8[length]: bytes
 *
 * @param string - The string to encode
 * @param offset - The offset to encode the string at.
 * @param view - The buffer view to encode the string into.
 * @returns The next offset.
 */
export default function encodeString(string: string, view: BufferView) {
  view.writeU32(utf8size(string))
    .write(string);
};
