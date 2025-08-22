import type ValidateInit from "#frontend/ValidateInit";
import type Dict from "@rcompat/type/Dict";
import type JSONPointer from "@rcompat/type/JSONPointer";
import type JSONValue from "@rcompat/type/JSONValue";

type Method = "DELETE" | "PATCH" | "POST" | "PUT";

type Options<T> = {
  headers?: Dict<string>;
  map?: (v: T) => JSONValue;
  path?: JSONPointer;
};

export default function toValidated<T, R>(
  validateSignal: (init: ValidateInit<T>) => R,
) {
  return (initial: T) => {
    const verb = (method: Method) =>
      (url: string, options?: Options<T>) => {
        return validateSignal({
          headers: options?.headers,
          initial,
          map: options?.map,
          method,
          path: options?.path,
          url,
        });
      };

    return {
      delete: verb("DELETE"),
      patch: verb("PATCH"),
      post: verb("POST"),
      put: verb("PUT"),
    };
  };
}
