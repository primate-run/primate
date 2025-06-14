
import toBufferView from "./to-buffer-view.js";
import encodeString from "./encode-string.js";
import encodeUint32LE from "./encode-uint32le.js";
import sizeOfString from "./size-of-string.js";
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
  const bufferView = toBufferView(output);

  let offset = 0;
  offset = encodeString(data, offset, bufferView);
  offset = encodeUint32LE(session.new ? 1 : 0, offset, bufferView);
  offset = encodeString(session.id, offset, bufferView);

  return output;
}

export default encodeSession;
