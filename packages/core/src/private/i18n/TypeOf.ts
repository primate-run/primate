type Normalize<S extends string> =
  Lowercase<S extends `${infer A}|${string}` ? A : S>;

type TypeOf<T extends string> =
  Normalize<T> extends "n" | "number" ? number :
  Normalize<T> extends "d" | "date" ? Date | number :
  Normalize<T> extends "c" | "currency" ? number :
  Normalize<T> extends "o" | "ordinal" ? number :
  Normalize<T> extends "a" | "ago" ? number :
  Normalize<T> extends "l" | "list" ? string[] :
  Normalize<T> extends `u(${string})` | `unit(${string})` ? number :
  string;

export type { TypeOf as default };
