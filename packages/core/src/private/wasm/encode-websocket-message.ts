import buffersize from "#wasm/buffersize";
import encodeBuffer from "#wasm/encode-buffer";
import encodeString from "#wasm/encode-string";
import I32_SIZE from "#wasm/I32_SIZE";
import stringSize from "#wasm/stringsize";
import BufferView from "@rcompat/bufferview";

const SIZE_I64 = BigInt64Array.BYTES_PER_ELEMENT;

const WEBSOCKET_MESSAGE_KIND_STRING = 0;
const WEBSOCKET_MESSAGE_KIND_BYTES = 1;

type Message = string | Uint8Array;

export default function encodeWebsocketMessage(id: bigint, message: Message) {
  const size = SIZE_I64 // WebsocketID
    + I32_SIZE // Kind
    + (
      typeof message === "string"
        ? stringSize(message)
        : buffersize(message)
    );
  const output = new Uint8Array(size);
  const bufferView = new BufferView(output);

  bufferView.writeU64(id);

  if (typeof message === "string") {
    bufferView.writeU32(WEBSOCKET_MESSAGE_KIND_STRING);
    encodeString(message, bufferView);
  } else {
    bufferView.writeU32(WEBSOCKET_MESSAGE_KIND_BYTES);
    encodeBuffer(message, bufferView);
  }

  return output;
};
