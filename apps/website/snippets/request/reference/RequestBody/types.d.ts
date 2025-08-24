import type JSONValue from "@rcompat/type/JSONValue";

interface RequestBody {
  type: "text" | "json" | "fields" | "binary" | "none";

  text(): string;

  json(): JSONValue;
  json<S>(schema: { parse(x: unknown): S }): S;

  fields(): Record<string, FormDataEntryValue>;
  fields<S>(schema: { parse(x: unknown): S }): S;

  binary(): Blob;

  none(): null;
}
