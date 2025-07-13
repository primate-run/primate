import mark from "#mark";

export default class RuntimeError extends Error {
  constructor(message: string, ...params: string[]) {
    super(mark(message, ...params));
  }

  get level() {
    return "error";
  }
};
