import PartialDictionary from "@rcompat/type/PartialDictionary";
import encodeString from "./encode-string.js";
import encodeUint32LE from "./encode-uint32le.js";
import type toBufferView from "./to-buffer-view.js";
type BufferView = ReturnType<typeof toBufferView>;

const encodeStringMap = (map: PartialDictionary<string>, offset: number, bufferView: BufferView) => {
  // only "set" entries are allowed
  const entries = Object.entries(map).filter(([, value]) => Boolean(value));
  const count = entries.length;

  offset = encodeUint32LE(count, offset, bufferView);

  for (const [key, value] of entries) {
    offset = encodeString(key, offset, bufferView);
    offset = encodeString(value!, offset, bufferView);
  }

  return offset;
}

export default encodeStringMap;