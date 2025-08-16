import AppError from "#AppError";
import { bin, form, json, multipart, txt } from "@rcompat/http/mime";
import type Dict from "@rcompat/type/Dict";
import type JSONValue from "@rcompat/type/JSONValue";

type Fields = Dict<FormDataEntryValue>;

type Parsed =
  | { type: "bin"; value: Blob }
  | { type: "fields"; value: Fields }
  | { type: "json"; value: JSONValue }
  | { type: "none"; value: null }
  | { type: "text"; value: string }
  ;

type Schema = { parse: (v: unknown) => unknown };

type ParseReturn<S> =
  S extends { parse: (v: unknown) => infer R } ? R : never;

async function fromJSON(request: Request): Promise<JSONValue> {
  return request.json();
}

async function fromForm(request: Request) {
  const fields: Fields = Object.create(null);

  for (const [key, value] of (await request.formData()).entries()) {
    fields[key] = value;
  }

  return fields;
};

export default class Body {
  #parsed: Parsed;

  static async parse(request: Request, url: URL): Promise<Body> {
    const raw = request.headers.get("content-type") ?? "none";
    const type = raw.split(";")[0].trim().toLowerCase();
    const path = url.pathname;

    try {
      switch (type) {
        case bin:
          return new Body({ type: "bin", value: await request.blob() });
        case form:
        case multipart:
          return new Body({ type: "fields", value: await fromForm(request) });
        case json:
          return new Body({ type: "json", value: await fromJSON(request) });
        case txt:
          return new Body({ type: "text", value: await request.text() });
        case "none":
          return Body.none();
        default:
          throw new AppError("{0}: unsupported content type {1}", path, type);
      }
    } catch (cause) {
      const message = "{0}: unparseable content type {1} - cause:\n[2]";
      throw new AppError(message, path, type, cause);
    }
  }

  static none() {
    return new Body({ type: "none", value: null });
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

  json(): JSONValue;
  json<S extends Schema>(schema: S): ParseReturn<S>;
  json(schema?: { parse: (v: unknown) => unknown }) {
    if (this.type !== "json") {
      throw new AppError("expected JSON, got {0}", this.type);
    }

    const value = this.#value<JSONValue>();
    return schema ? schema.parse(value) : value;
  }

  fields(): Fields;
  fields<S extends Schema>(schema: S): ParseReturn<S>;
  fields(schema?: { parse: (v: unknown) => unknown }) {
    if (this.type !== "fields") {
      throw new AppError("expected form, got {0}", this.type);
    }

    const value = this.#value<Fields>();
    return schema ? schema.parse(value) : value;
  }

  text() {
    if (this.type !== "text") {
      throw new AppError("expected plaintext, got {0}", this.type);
    }

    return this.#value<string>();
  }

  binary() {
    if (this.type !== "bin") {
      throw new AppError("expected binary, got {0}", this.type);
    }
    return this.#value<Blob>();
  }
}
