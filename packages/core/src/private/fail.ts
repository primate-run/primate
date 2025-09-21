import AppError from "#AppError";

export default function fail(message: string, ...params: unknown[]) {
  return new AppError(message, ...params);
}
