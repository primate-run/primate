import encodeBuffer from "./encode-buffer.js";
import encodeString from "./encode-string.js";
import sizeOfBuffer from "./size-of-buffer.js";
import sizeOfString from "./size-of-string.js";
import BufferView from "@rcompat/bufferview";

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
  const bufferView = new BufferView(output);
  
  bufferView.writeU64(id);
  
  if (typeof message === "string") {
    bufferView.writeU32(WEBSOCKET_MESSAGE_KIND_STRING)
    encodeString(message, bufferView);
  } else {
    bufferView.writeU32(WEBSOCKET_MESSAGE_KIND_BYTES);
    encodeBuffer(message, bufferView);
  }

  return output;
};

export default encodeWebsocketMessage;
