import E from "#error";
import { MIME } from "@rcompat/http";
import is from "@rcompat/is";
import type { Dict, JSONValue, Schema } from "@rcompat/type";

type Form = Dict<string>;

type Parsed =
  | { type: "binary"; value: Blob }
  | { type: "form"; value: Dict<string> }
  | { type: "json"; value: JSONValue }
  | { type: "none"; value: null }
  | { type: "text"; value: string }
  ;

type ParseReturn<S> =
  S extends { parse: (v: unknown) => infer R } ? R : never;

async function anyform(request: Request) {
  const form: Dict<string> = Object.create(null);
  const files: Dict<File> = Object.create(null);

  for (const [key, value] of (await request.formData()).entries()) {
    if (is.string(value)) {
      form[key] = value;
    } else {
      files[key] = value;
    }
  }

  return { form, files };
};

async function parse(request: Request, url: URL): Promise<RequestBody> {
  const raw = request.headers.get("content-type") ?? "none";
  const type = raw.split(";")[0].trim().toLowerCase();
  const path = url.pathname;

  try {
    switch (type) {
      case MIME.APPLICATION_OCTET_STREAM:
        return new RequestBody({ type: "binary", value: await request.blob() });
      case MIME.APPLICATION_X_WWW_FORM_URLENCODED:
      case MIME.MULTIPART_FORM_DATA: {
        const { form, files } = await anyform(request);
        return new RequestBody({ type: "form", value: form }, files);
      }
      case MIME.APPLICATION_JSON:
        return new RequestBody({ type: "json", value: await request.json() });
      case MIME.TEXT_PLAIN:
        return new RequestBody({ type: "text", value: await request.text() });
      case "none":
        return RequestBody.none();
      default:
        throw E.request_unsupported_mime(path, type);
    }
  } catch (cause) {
    throw E.request_unparsable_mime(path, type, cause as Error);
  }
}

function none() {
  return new RequestBody({ type: "none", value: null });
}

export default class RequestBody {
  #parsed: Parsed;
  #files: Dict<File>;

  static parse = parse;
  static none = none;

  constructor(parsed: Parsed, files: Dict<File> = {}) {
    this.#parsed = parsed;
    this.#files = files;
  }

  get type() {
    return this.#parsed.type;
  }

  #value<T extends Parsed["value"]>() {
    return this.#parsed.value as T;
  }

  #unexpected_body(expected: string) {
    throw E.request_unexpected_body(expected, this.type);
  }

  json(): JSONValue;
  json<S extends Schema<unknown>>(schema: S): ParseReturn<S>;
  json(schema?: Schema<unknown>) {
    if (this.type !== "json") this.#unexpected_body("JSON");

    const value = this.#value<JSONValue>();
    return schema === undefined ? value : schema.parse(value);
  }

  form(): Form;
  form<S extends Schema<unknown>>(schema: S): ParseReturn<S>;
  form(schema?: Schema<unknown>) {
    if (this.type !== "form") this.#unexpected_body("form");

    const value = this.#value<Form>();
    return schema === undefined ? value : schema.parse(value);
  }

  files(): Dict<File> {
    if (this.type !== "form") this.#unexpected_body("form");

    return this.#files;
  }

  text() {
    if (this.type !== "text") this.#unexpected_body("plaintext");

    return this.#value<string>();
  }

  binary() {
    if (this.type !== "binary") {
      this.#unexpected_body("binary");
    }
    return this.#value<Blob>();
  }

  none() {
    if (this.type !== "none") {
      this.#unexpected_body("none");
    }
    return null;
  }
}
