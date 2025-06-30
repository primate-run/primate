import assert from "@rcompat/assert";
import type BufferView from "@rcompat/bufferview";

const NONE = 0;
const SOME = 1;

type Decoder<T> = (source: BufferView) => T;

const decodeOption = <T>(
  kind: Decoder<T>,
  source: BufferView,
): T | undefined => {
  const option = source.readU32();
  assert(
    option === NONE || option === SOME,
    "Error decoding option, invalid option value.",
  );
  return option === SOME ? kind(source) : void 0;
};

export default decodeOption;