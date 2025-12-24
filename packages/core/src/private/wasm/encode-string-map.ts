import encodeString from "#wasm/encode-string";
import type BufferView from "@rcompat/bufferview";
import type { PartialDict } from "@rcompat/type";

const encodeStringMap = (map: PartialDict<string>, view: BufferView) => {
  // only "set" entries are allowed
  const entries = Object.entries(map)
    .filter(([, value]) => value && value.length > 0);
  const count = entries.length;

  view.writeU32(count);

  for (const [key, value] of entries) {
    encodeString(key, view);
    encodeString(value!, view);
  }
};

export default encodeStringMap;
