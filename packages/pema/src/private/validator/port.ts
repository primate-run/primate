import ParseError from "#ParseError";

// 1000
const min = 2 ** 10;
// 65535
const max = 2 ** 16 - 1;

export default (port: number) => {
  if (port < min || port > max) {
    throw new ParseError([{
      input: port,
      message: `${port} out of port range (${min} - ${max})`,
      path: "",
    }]);
  }
};
