import utf8ByteLength from "./utf8-byte-length.js";

const sizeOfString = (str: string) => utf8ByteLength(str) + 4;

export default sizeOfString;
