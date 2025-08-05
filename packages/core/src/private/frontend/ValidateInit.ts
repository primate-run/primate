import type Dict from "@rcompat/type/Dict";

type ValidateInit<T> = {
  headers?: Dict<string>;
  initial: T;
  mapper: (value: T) => unknown;
  method: "DELETE" | "PATCH" | "POST" | "PUT";
  url: string;
};

export type { ValidateInit as default };
