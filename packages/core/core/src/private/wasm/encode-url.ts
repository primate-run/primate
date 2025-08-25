import encodeString from "#wasm/encode-string";
import type BufferView from "@rcompat/bufferview";

/**
 * Encode a url as a string into a bufferView.
 *
 * @param url - The url to encode.
 * @param offset - The offset to encode the url at.
 * @param view - The buffer view to encode the url into.
 * @returns The next offset.
 */
export default function encodeURL(url: URL, view: BufferView) {
  return encodeString(url.toString(), view);
};
