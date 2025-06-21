import assert from "@rcompat/assert";
import decodeString from "./decode-string.js";
import decodeBytes from "./decode-bytes.js";
import BufferView from "@rcompat/bufferview";

type BufferViewSource = ConstructorParameters<typeof BufferView>;

const WEBSOCKET_MESSAGE_KIND_STRING = 0;
const WEBSOCKET_MESSAGE_KIND_BYTES = 1;

const decodeWebsocketSendMessage = (...bufferSource: BufferViewSource) => {
  const bufferView = new BufferView(...bufferSource);
  const id = bufferView.readU64();
  const kind = bufferView.readU32();
  assert(
    kind === WEBSOCKET_MESSAGE_KIND_STRING
    || kind === WEBSOCKET_MESSAGE_KIND_BYTES,
    "Invalid websocket message kind."
  );
  const message = kind === WEBSOCKET_MESSAGE_KIND_STRING
    ? decodeString(bufferView)
    : decodeBytes(bufferView);
  return { id, message };
};

export default decodeWebsocketSendMessage;
