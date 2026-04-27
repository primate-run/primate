import E from "#errors";
import assert from "@rcompat/assert";
import http from "@rcompat/http";
import is from "@rcompat/is";
import type { Dict, JSONValue } from "@rcompat/type";
import type { Parsed } from "pema";

type Form = Dict<string>;
type Files = Dict<File>;
type MIMES = typeof http.MIME;
type MIME = MIMES[keyof MIMES];

type BodyOptions = {
  contentType: MIME;
  schema: Parsed<unknown>;
};

const patched = Symbol("RequestBody.patch");

export default class RequestBody {
  #request: Request;
  #parsed: boolean = false;
  #options: BodyOptions | undefined;

  constructor(request: Request, options?: BodyOptions) {
    this.#request = request;
    this.#options = options;
  }

  #parse(mime: MIME) {
    if (this.#parsed) throw E.request_body_already_parsed();
    const raw = this.#request.headers.get("content-type") ?? "none";
    const content_type = raw.split(";")[0].trim().toLowerCase();
    assert.true(mime === content_type);
    this.#parsed = true;
  }

  [patched](options: BodyOptions): RequestBody {
    return new RequestBody(this.#request, options);
  }

  async json(): Promise<JSONValue> {
    this.#parse(http.MIME.APPLICATION_JSON);
    const raw = await this.#request.json();
    return this.#options?.contentType === http.MIME.APPLICATION_JSON
      ? this.#options.schema.parse(raw) as JSONValue
      : raw;
  }

  async form(): Promise<Form> {
    this.#parse(http.MIME.APPLICATION_X_WWW_FORM_URLENCODED);
    const form: Form = Object.create(null);
    for (const [key, value] of (await this.#request.formData()).entries()) {
      form[key] = assert.string(value);
    }
    const raw = form;
    return this.#options?.contentType === http.MIME.APPLICATION_X_WWW_FORM_URLENCODED
      ? this.#options.schema.parse(raw) as Form
      : raw;
  }

  async multipart(): Promise<{ form: Form; files: Files }> {
    this.#parse(http.MIME.MULTIPART_FORM_DATA);
    const form: Form = Object.create(null);
    const files: Files = Object.create(null);
    for (const [key, value] of (await this.#request.formData()).entries()) {
      if (is.string(value)) {
        form[key] = value;
      } else {
        files[key] = value;
      }
    }
    const raw = { form, files };
    return this.#options?.contentType === http.MIME.MULTIPART_FORM_DATA
      ? this.#options.schema.parse(raw) as { form: Form; files: Files }
      : raw;
  }

  async text(): Promise<string> {
    this.#parse(http.MIME.TEXT_PLAIN);
    const raw = await this.#request.text();
    return this.#options?.contentType === http.MIME.TEXT_PLAIN
      ? this.#options.schema.parse(raw) as string
      : raw;
  }

  async blob(): Promise<Blob> {
    this.#parse(http.MIME.APPLICATION_OCTET_STREAM);
    const raw = await this.#request.blob();
    return this.#options?.contentType === http.MIME.APPLICATION_OCTET_STREAM
      ? this.#options.schema.parse(raw) as Blob
      : raw;
  }
}

export { patched as BodyPatch };
