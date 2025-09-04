import type SessionFacade from "#session/SessionFacade";
import encodeString from "#wasm/encode-string";
import I32_SIZE from "#wasm/I32_SIZE";
import stringSize from "#wasm/stringsize";
import BufferView from "@rcompat/bufferview";

export default function encodeSession(session: SessionFacade<unknown>) {
  if (session.exists) {
    const data = JSON.stringify(session.get());
    const dataSize = stringSize(data);
    const idSize = stringSize(session.id ?? "");
    const size = dataSize // data payload
      + I32_SIZE // new flat
      + idSize; // id payload
    
    const output = new Uint8Array(size);
    const bufferView = new BufferView(output);
    bufferView.writeU32(1);
    encodeString(session.id ?? "", bufferView);
    encodeString(data, bufferView);
    return output;
  }

  // does not exist (only 0s)
  const buffer = new Uint8Array(4);
  return buffer;
};
