import fail from "#fail";
import MIME from "@rcompat/http/mime";
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

export default class RequestBody {
  #parsed: Parsed;
  #files: Dict<File>;

  static async parse(request: Request, url: URL): Promise<RequestBody> {
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
          throw fail("{0}: unsupported content type {1}", path, type);
      }
    } catch (cause) {
      const message = "{0}: unparseable content type {1} - cause:\n[2]";
      throw fail(message, path, type, cause);
    }
  }

  static none() {
    return new RequestBody({ type: "none", value: null });
  }

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

  #throw(expected: string) {
    throw fail("request body: expected {0}, got {1}", expected, this.type);
  }

  json(): JSONValue;
  json<S extends Schema<unknown>>(schema: S): ParseReturn<S>;
  json(schema?: Schema<unknown>) {
    if (this.type !== "json") {
      this.#throw("JSON");
    }

    const value = this.#value<JSONValue>();
    return schema ? schema.parse(value) : value;
  }

  form(): Form;
  form<S extends Schema<unknown>>(schema: S): ParseReturn<S>;
  form(schema?: Schema<unknown>) {
    if (this.type !== "form") {
      this.#throw("form");
    }

    const value = this.#value<Form>();
    return schema ? schema.parse(value) : value;
  }

  files(): Dict<File> {
    if (this.type !== "form") {
      this.#throw("form");
    }

    return this.#files;
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
