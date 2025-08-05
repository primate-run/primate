import type BufferViewSource from "#wasm/BufferViewSource";
import decodeString from "#wasm/decode-string";
import BufferView from "@rcompat/bufferview";

function decodeJson(view: BufferView) {
  return JSON.parse(decodeString(view));
};

decodeJson.from = (...source: BufferViewSource) => {
  return decodeJson(new BufferView(...source));
};

export default decodeJson;
