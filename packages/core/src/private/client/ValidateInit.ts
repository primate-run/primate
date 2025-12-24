import type { Dict, JSONPointer, JSONValue } from "@rcompat/type";

type ValidateInit<T> = {
  headers?: Dict<string>;
  initial: T;
  map?: (value: T) => JSONValue;
  method: "DELETE" | "PATCH" | "POST" | "PUT";
  path?: JSONPointer;
  url: string;
};

export type { ValidateInit as default };
