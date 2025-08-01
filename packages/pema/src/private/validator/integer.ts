export default (n: bigint | number) => {
  if (!Number.isInteger(n)) {
    throw new Error(`${n} is not an integer`);
  };
};
