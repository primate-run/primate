export default (id: bigint) => {
  const buffer = new BigUint64Array(1);
  buffer[0] = id;
  return new Uint8Array(buffer.buffer);
}
