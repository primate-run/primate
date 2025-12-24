import type { JSONPointer } from "@rcompat/type";

// Rebase a relative pointer under a base (rel must be "" or start with "/")
export default function rebase(base: JSONPointer, rel: JSONPointer) {
  if (base === "") return rel;
  if (rel === "") return base;
  return (base + rel) as JSONPointer;
}
