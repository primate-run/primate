import type ValidateInit from "#frontend/ValidateInit";
import type Dict from "@rcompat/type/Dict";

export default function makeValidate<T, R>(
  validateSignal: (init: ValidateInit<T>) => R,
) {
  return (initial: T) => ({
    delete: (url: string, mapper: (v: T) => unknown, headers?: Dict<string>) =>
      validateSignal({ headers, initial, mapper, method: "DELETE", url }),

    patch: (url: string, mapper: (v: T) => unknown, headers?: Dict<string>) =>
      validateSignal({ headers, initial, mapper, method: "PATCH", url }),

    post: (url: string, mapper: (v: T) => unknown, headers?: Dict<string>) =>
      validateSignal({ headers, initial, mapper, method: "POST", url }),

    put: (url: string, mapper: (v: T) => unknown, headers?: Dict<string>) =>
      validateSignal({ headers, initial, mapper, method: "PUT", url }),
  });
}
