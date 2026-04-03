import E from "#errors";

// 1000
const min = 2 ** 10;
// 65535
const max = 2 ** 16 - 1;

export default function port(given: number) {
  if (given < min || given > max) {
    throw E.out_of_range(given, `${given} out of port range (${min} - ${max})`);
  }
};
