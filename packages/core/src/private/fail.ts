import AppError from "#AppError";

function fail(strings: TemplateStringsArray, ...params: unknown[]) {
  const message = strings.reduce((acc, str, i) =>
    acc + (i > 0 ? `{${i - 1}}` : "") + str, "");
  return new AppError(message, ...params);
}

export default fail;
