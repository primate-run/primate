import type BufferViewSource from "#wasm/BufferViewSource";
import BufferView from "@rcompat/bufferview";

export default function decodeWebsocketClose(...source: BufferViewSource) {
  return { id: new BufferView(...source).readU64() };
};
