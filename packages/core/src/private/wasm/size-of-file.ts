const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;

const sizeOfFile = (file: File) => file.size + SIZE_I32;

export default sizeOfFile;
