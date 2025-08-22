import type JSONPointer from "@rcompat/type/JSONPointer";

export default interface Issue {
  readonly message: string;
  readonly path: JSONPointer;
}
