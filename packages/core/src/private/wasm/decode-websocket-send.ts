import type BufferViewSource from "#wasm/BufferViewSource";
import decodeBytes from "#wasm/decode-bytes";
import decodeString from "#wasm/decode-string";
import assert from "@rcompat/assert";
import BufferView from "@rcompat/bufferview";

const WEBSOCKET_MESSAGE_KIND_STRING = 0;
const WEBSOCKET_MESSAGE_KIND_BYTES = 1;

export default function decodeWebsocketSend(...source: BufferViewSource) {
  const bufferView = new BufferView(...source);
  const id = bufferView.readU64();
  const kind = bufferView.readU32();
  assert.true(
    kind === WEBSOCKET_MESSAGE_KIND_STRING
    || kind === WEBSOCKET_MESSAGE_KIND_BYTES,
    "Invalid websocket message kind.",
  );
  const message = kind === WEBSOCKET_MESSAGE_KIND_STRING
    ? decodeString(bufferView)
    : decodeBytes(bufferView);
  return { id, message };
};
