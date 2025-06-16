import assert from "@rcompat/invariant/assert";
import decodeUint32LE from "./decode-uint32le.js";
import type toBufferView from "./to-buffer-view.js";
import type Offset from "./offset.js";

type BufferView = ReturnType<typeof toBufferView>;

const NONE = 0;
const SOME = 1;

type Decoder<T> = (offset: Offset, source: BufferView) => T;

const decodeOption = <T>(kind: Decoder<T>, offset: Offset, source: BufferView): T | undefined => {
  const option = decodeUint32LE(offset, source);
  assert(option === NONE || option === SOME, "Error decoding option, invalid option value.");
  return option === SOME
    ? kind(offset, source)
    : void 0;
};

export default decodeOption;