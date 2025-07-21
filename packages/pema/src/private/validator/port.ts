// 1000
const min = 2 ** 10;
// 65535
const max = 2 ** 16 - 1;

export default (port: number) => {
  if (port < min || port > max) {
    throw new Error(`${port} out of port range (${min} - ${max})`);
  }
};
