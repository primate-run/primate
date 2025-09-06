import is from "@rcompat/assert/is";
import pema from "pema";
import boolean from "pema/boolean";
import number from "pema/number";
import string from "pema/string";
import union from "pema/union";

const Schema = pema({
  httpOnly: boolean.default(true),
  path: string.default("/"),
  sameSite: union("Lax", "None", "Strict"),
  secure: boolean,
  maxAge: number.optional(), // seconds
});

type Options = typeof Schema.input;

export default function cookie(name: string, value: string, options: Options) {
  is(name).string();
  is(value).string();
  const parsed = Schema.parse(options);

  const parts = [`${name}=${value}`];
  parts.push(`Path=${parsed.path}`);
  parts.push(`SameSite=${parsed.sameSite}`);

  if (parsed.maxAge !== undefined) parts.push(`Max-Age=${parsed.maxAge}`);
  if (parsed.httpOnly) parts.push("HttpOnly");
  if (parsed.secure && parsed.sameSite !== "None") parts.push("Secure");

  return parts.join("; ");
};
