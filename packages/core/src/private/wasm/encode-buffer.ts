import type BufferView from "@rcompat/bufferview";

const encodeBuffer = (buffer: Uint8Array, bufferView: BufferView) => {
  const byteLength = buffer.byteLength;
  bufferView
    .writeU32(byteLength)
    .writeBytes(buffer);
};

export default encodeBuffer;