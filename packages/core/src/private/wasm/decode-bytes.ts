import type BufferView from "@rcompat/bufferview"

const decodeBytes = (source: BufferView): Uint8Array => {
  const bytesSize = source.readU32();

  return source.readBytes(bytesSize);
}

export default decodeBytes;
