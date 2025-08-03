import type Dict from "@rcompat/type/Dict";
import type JSONValue from "@rcompat/type/JSONValue";

type Body =
  | Dict<File | string>
  | JSONValue
  | null
  | string
  ;

export { Body as default };
