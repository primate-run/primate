import type JSONValue from "@rcompat/type/JSONValue";

interface RequestBody {
  type: "text" | "json" | "form" | "binary" | "none";

  text(): string;

  json(): JSONValue;
  json<S>(schema: { parse(x: unknown): S }): S;

  form(): Record<string, FormDataEntryValue>;
  form<S>(schema: { parse(x: unknown): S }): S;

  binary(): Blob;

  none(): null;

  files(): Record<string, File>;
}
