import encodeBigUint64LE from "./encode-bigunt64le.js";
import encodeBuffer from "./encode-buffer.js";
import encodeString from "./encode-string.js";
import encodeUint32LE from "./encode-uint32le.js";
import sizeOfBuffer from "./size-of-buffer.js";
import sizeOfString from "./size-of-string.js";
import toBufferView from "./to-buffer-view.js";

const SIZE_I64 = BigInt64Array.BYTES_PER_ELEMENT;
const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;

const WEBSOCKET_MESSAGE_KIND_STRING = 0;
const WEBSOCKET_MESSAGE_KIND_BYTES = 1;

const encodeWebsocketMessage = (id: bigint, message: string | Uint8Array) => {
  const size = SIZE_I64 // WebsocketID
    + SIZE_I32 // Kind
    + (
      typeof message === "string"
        ? sizeOfString(message)
        : sizeOfBuffer(message)
    );
  const output = new Uint8Array(size);
  const bufferView = toBufferView(output);
  let offset = 0;
  offset = encodeBigUint64LE(id, offset, bufferView);
  offset = encodeUint32LE(
    typeof message === "string"
      ? WEBSOCKET_MESSAGE_KIND_STRING
      : WEBSOCKET_MESSAGE_KIND_BYTES,
      offset,
      bufferView,
  );
  offset = typeof message === "string"
    ? encodeString(message, offset, bufferView)
    : encodeBuffer(message, offset, bufferView);

  return output;
};

export default encodeWebsocketMessage;
