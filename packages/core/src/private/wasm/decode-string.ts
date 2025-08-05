import type BufferView from "@rcompat/bufferview";

export default function decodeString(source: BufferView) {
  return source.read(source.readU32());
};
