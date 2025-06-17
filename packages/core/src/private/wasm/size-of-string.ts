import utf8ByteLength from "./utf8-byte-length.js";
const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;

const sizeOfString = (str: string) => utf8ByteLength(str) + SIZE_I32;

export default sizeOfString;
