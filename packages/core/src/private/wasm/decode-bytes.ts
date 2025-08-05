import type BufferView from "@rcompat/bufferview";

export default function decodeBytes(source: BufferView) {
  return source.readBytes(source.readU32());
};
