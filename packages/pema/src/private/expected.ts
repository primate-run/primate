function print_got(x: unknown) {
  if (x === undefined) {
    return "undefined";
  }
  if (x === null) {
    return "null";
  }
  return `\`${x?.toString() ?? x}\` (${(typeof x)})`;
}

export default (type: string, x: unknown) =>
  `expected ${type}, got ${print_got(x)}`;
