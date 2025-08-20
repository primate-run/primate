import mark from "@rcompat/cli/mark";

export default class SchemaError extends Error {
  constructor(message: string, ...params: string[]) {
    super(mark(message, ...params));
  }
};
