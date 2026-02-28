import AppError from "#AppError";

type Strings = TemplateStringsArray;

export default function fail(strings: Strings, ...params: unknown[]) {
  const message = strings.reduce((acc, str, i) =>
    acc + (i > 0 ? `{${i - 1}}` : "") + str, "");
  return new AppError(message, ...params);
}
