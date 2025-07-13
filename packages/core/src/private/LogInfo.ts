import mark from "#mark";

export default class LogInfo extends Error {
  level = "info";

  constructor(message: string, ...params: string[]) {
    super(mark(message, ...params));
  }
};
