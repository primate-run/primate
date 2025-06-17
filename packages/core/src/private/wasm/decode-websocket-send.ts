import assert from "@rcompat/invariant/assert";
import decodeBigUint64LE from "./decode-biguint64le.js";
import decodeUint32LE from "./decode-uint32le.js";
import toBufferView from "./to-buffer-view.js";
import decodeString from "./decode-string.js";
import decodeBytes from "./decode-bytes.js";

type BufferViewSource = Parameters<typeof toBufferView>[0];

const WEBSOCKET_MESSAGE_KIND_STRING = 0;
const WEBSOCKET_MESSAGE_KIND_BYTES = 1;

const decodeWebsocketSendMessage = (bufferSource: BufferViewSource) => {
  const bufferView = toBufferView(bufferSource);
  const offset = { ptr: 0 };
  const id = decodeBigUint64LE(offset, bufferView);
  const kind = decodeUint32LE(offset, bufferView);
  assert(
    kind === WEBSOCKET_MESSAGE_KIND_STRING
    || kind === WEBSOCKET_MESSAGE_KIND_BYTES,
    "Invalid websocket message kind."
  );
  const message = kind === WEBSOCKET_MESSAGE_KIND_STRING
    ? decodeString(offset, bufferView)
    : decodeBytes(offset, bufferView);
  return { id, message };
};

export default decodeWebsocketSendMessage;
