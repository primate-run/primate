const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;

const sizeOfBuffer = (buffer: Uint8Array) => SIZE_I32 + buffer.byteLength;

export default sizeOfBuffer;