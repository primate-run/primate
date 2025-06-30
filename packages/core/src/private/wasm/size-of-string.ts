import utf8Size from "@rcompat/string/utf8size";
const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;

const sizeOfString = (str: string) => utf8Size(str) + SIZE_I32;

export default sizeOfString;
