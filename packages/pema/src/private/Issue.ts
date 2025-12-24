import type { JSONPointer } from "@rcompat/type";

export default interface Issue {
  readonly message: string;
  readonly path: JSONPointer;
}
