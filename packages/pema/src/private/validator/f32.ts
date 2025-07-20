export default (x: number) => {
  if (x !== new Float32Array([x])[0]) {
    throw new Error(`${x} is not a 32-bit float`);
  }
};
