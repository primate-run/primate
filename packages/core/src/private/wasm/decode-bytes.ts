import type BufferView from "@rcompat/bufferview";

const decodeBytes = (source: BufferView) => {
  const bytesSize = source.readU32();

  return source.readBytes(bytesSize);
};

export default decodeBytes;
