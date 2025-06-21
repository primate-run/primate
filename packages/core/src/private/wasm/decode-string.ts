import type BufferView from "@rcompat/bufferview";

const decodeString = (source: BufferView): string => {
  const stringSize = source.readU32();

  return source.read(stringSize);
};

export default decodeString;