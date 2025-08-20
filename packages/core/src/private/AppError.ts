import mark from "@rcompat/cli/mark";

export default class AppError extends Error {
  constructor(message: string, ...params: unknown[]) {
    super(mark(message, ...params));
  }
};
