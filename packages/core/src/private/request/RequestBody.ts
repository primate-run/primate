import AppError from "#AppError";
import json from "@rcompat/http/mime/application/json";
import binary from "@rcompat/http/mime/application/octet-stream";
import form from "@rcompat/http/mime/application/x-www-form-urlencoded";
import formData from "@rcompat/http/mime/multipart/form-data";
import text from "@rcompat/http/mime/text/plain";
import type Dict from "@rcompat/type/Dict";
import type JSONValue from "@rcompat/type/JSONValue";

type Fields = Dict<FormDataEntryValue>;

type Parsed =
  | { type: "binary"; value: Blob }
  | { type: "fields"; value: Fields }
  | { type: "json"; value: JSONValue }
  | { type: "none"; value: null }
  | { type: "text"; value: string }
  ;

type Schema = { parse: (v: unknown) => unknown };

type ParseReturn<S> =
  S extends { parse: (v: unknown) => infer R } ? R : never;

async function fromForm(request: Request) {
  const fields: Fields = Object.create(null);

  for (const [key, value] of (await request.formData()).entries()) {
    fields[key] = value;
  }

  return fields;
};

export default class RequestBody {
  #parsed: Parsed;

  static async parse(request: Request, url: URL): Promise<RequestBody> {
    const raw = request.headers.get("content-type") ?? "none";
    const type = raw.split(";")[0].trim().toLowerCase();
    const path = url.pathname;

    try {
      switch (type) {
        case binary:
          return new RequestBody({ type: "binary", value: await request.blob() });
        case form:
        case formData:
          return new RequestBody({ type: "fields", value: await fromForm(request) });
        case json:
          return new RequestBody({ type: "json", value: await request.json() });
        case text:
          return new RequestBody({ type: "text", value: await request.text() });
        case "none":
          return RequestBody.none();
        default:
          throw new AppError("{0}: unsupported content type {1}", path, type);
      }
    } catch (cause) {
      const message = "{0}: unparseable content type {1} - cause:\n[2]";
      throw new AppError(message, path, type, cause);
    }
  }

  static none() {
    return new RequestBody({ type: "none", value: null });
  }

  constructor(p: Parsed) {
    this.#parsed = p;
  }

  get type() {
    return this.#parsed.type;
  }

  #value<T extends Parsed["value"]>() {
    return this.#parsed.value as T;
  }

  #throw(expected: string) {
    const message = "request body: expected {0}, got {1}";
    throw new AppError(message, expected, this.type);
  }

  json(): JSONValue;
  json<S extends Schema>(schema: S): ParseReturn<S>;
  json(schema?: { parse: (v: unknown) => unknown }) {
    if (this.type !== "json") {
      this.#throw("JSON");
    }

    const value = this.#value<JSONValue>();
    return schema ? schema.parse(value) : value;
  }

  fields(): Fields;
  fields<S extends Schema>(schema: S): ParseReturn<S>;
  fields(schema?: { parse: (v: unknown) => unknown }) {
    if (this.type !== "fields") {
      this.#throw("form fields");
    }

    const value = this.#value<Fields>();
    return schema ? schema.parse(value) : value;
  }

  text() {
    if (this.type !== "text") {
      this.#throw("plaintext");
    }

    return this.#value<string>();
  }

  binary() {
    if (this.type !== "binary") {
      this.#throw("binary");
    }
    return this.#value<Blob>();
  }

  none() {
    if (this.type !== "none") {
      this.#throw("none");
    }
    return null;
  }
}
