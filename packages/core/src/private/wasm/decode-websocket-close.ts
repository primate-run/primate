import decodeBigUint64LE from "./decode-biguint64le.js";
import toBufferView from "./to-buffer-view.js";

type BufferViewSource = Parameters<typeof toBufferView>[0];


const decodeWebsocketClose = (bufferSource: BufferViewSource) => {
  const bufferView = toBufferView(bufferSource);
  const offset = { ptr: 0 };
  const id = decodeBigUint64LE(offset, bufferView);
  return { id };
};

export default decodeWebsocketClose;
