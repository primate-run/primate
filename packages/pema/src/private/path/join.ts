import type JSONPointer from "@rcompat/type/JSONPointer";

// RFC 6901 escaping
function escapeToken(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

export default function join(
  base: JSONPointer,
  ...tokens: (number | string)[]
): JSONPointer {
  if (tokens.length === 0) return base;
  const tail = tokens.map(t => escapeToken(String(t))).join("/");
  if (base === "") return ("/" + tail) as JSONPointer;
  return (base + "/" + tail) as JSONPointer;
}

