
function utf8ByteLength(str: string) {
  let length = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i)!;
    if (code <= 0x7f) {
      length += 1;
    } else if (code <= 0x7ff) {
      length += 2;
    } else if (code <= 0xffff) {
      length += 3;
    } else if (code <= 0x10ffff) {
      length += 4;
    }

    // Strings in js have 16 bits long character sequences, and when
    // the codepoint is above 0x10000, it requires 2 values
    // in the string, and "i" should be advanced again to skip
    // over the second codepoint in the sequence
    if (code >= 0x10000) i++;
  }
  return length;
}

export default utf8ByteLength;
