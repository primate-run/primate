import encodeString from "./encode-string.js";
import type BufferView from "@rcompat/bufferview";

/**
 * Encode a url as a string into a bufferView.
 * 
 * @param url - The url to encode.
 * @param offset - The offset to encode the url at.
 * @param bufferView - The buffer view to encode the url into.
 * @returns The next offset.
 */
const encodeURL = (url: URL, bufferView: BufferView) => {
  const str = url.toString();
  return encodeString(str, bufferView);
}

export default encodeURL;