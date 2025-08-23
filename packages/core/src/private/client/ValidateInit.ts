import type Dict from "@rcompat/type/Dict";
import type JSONPointer from "@rcompat/type/JSONPointer";
import type JSONValue from "@rcompat/type/JSONValue";

type ValidateInit<T> = {
  headers?: Dict<string>;
  initial: T;
  map?: (value: T) => JSONValue;
  method: "DELETE" | "PATCH" | "POST" | "PUT";
  path?: JSONPointer;
  url: string;
};

export type { ValidateInit as default };
