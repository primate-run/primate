import toBufferView from "./to-buffer-view.js";
import type Offset from "./offset.js";
import decodeString from "./decode-string.js";

type BufferView = ReturnType<typeof toBufferView>;
type BufferViewSource = Parameters<typeof toBufferView>[0];

const decodeJson = (source: Offset, view: BufferView) => {
  const str = decodeString(source, view);
  return JSON.parse(str);
};

decodeJson.from = (buffer: BufferViewSource) => {
  const bufferView = toBufferView(buffer);
  return decodeJson({ ptr: 0 }, bufferView);
}

export default decodeJson;