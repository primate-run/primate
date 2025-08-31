import type SessionFacade from "#session/SessionFacade";
import encodeString from "#wasm/encode-string";
import I32_SIZE from "#wasm/I32_SIZE";
import stringsize from "#wasm/stringsize";
import BufferView from "@rcompat/bufferview";

export default function encodeSession(session: SessionFacade<unknown>) {
  const data = JSON.stringify(session.get());
  const dataSize = stringsize(data);
  const idSize = stringsize(session.id ?? "");

  const size = dataSize // data payload
    + I32_SIZE // new flat
    + idSize; // id payload

  const output = new Uint8Array(size);
  const bufferView = new BufferView(output);

  encodeString(data, bufferView);
  bufferView.writeU32(session.exists ? 1 : 0);
  encodeString(session.id ?? "", bufferView);

  return output;
};
