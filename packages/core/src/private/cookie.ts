import assert from "@rcompat/assert";
import p from "pema";

const Schema = p({
  httpOnly: p.boolean.default(true),
  path: p.string.default("/"),
  sameSite: p.union("Lax", "None", "Strict"),
  secure: p.boolean,
  maxAge: p.number.optional(), // seconds
});

type Options = typeof Schema.input;

export default function cookie(name: string, value: string, options: Options) {
  assert.string(name);
  assert.string(value);

  const parsed = Schema.parse(options);
  const parts = [`${name}=${value}`];
  parts.push(`Path=${parsed.path}`);
  parts.push(`SameSite=${parsed.sameSite}`);

  if (parsed.maxAge !== undefined) parts.push(`Max-Age=${parsed.maxAge}`);
  if (parsed.httpOnly) parts.push("HttpOnly");
  if (parsed.secure && parsed.sameSite !== "None") parts.push("Secure");

  return parts.join("; ");
};
