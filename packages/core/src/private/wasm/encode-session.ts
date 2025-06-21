import encodeString from "./encode-string.js";
import sizeOfString from "./size-of-string.js";
import BufferView from "@rcompat/bufferview";

const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;

type SessionShape = {
  data: any;
  new: boolean;
  id: string;
};

const encodeSession = (session: SessionShape) => {
  const data = JSON.stringify(session.data);
  const dataSize = sizeOfString(data);
  const idSize = sizeOfString(session.id);

  const size = dataSize // data payload
    + SIZE_I32 // new flat
    + idSize; // id payload

  const output = new Uint8Array(size);
  const bufferView = new BufferView(output);

  encodeString(data, bufferView);
  bufferView.writeU32(session.new ? 1 : 0);
  encodeString(session.id, bufferView);

  return output;
}

export default encodeSession;
