import E from "#errors";
import assert from "@rcompat/assert";
import http from "@rcompat/http";
import is from "@rcompat/is";
import type { Dict, JSONValue } from "@rcompat/type";

type Form = Dict<string>;
type Files = Dict<File>;

type MIMES = typeof http.MIME;
type MIME = MIMES[keyof MIMES];

export default class RequestBody {
  #request: Request;
  #parsed: boolean = false;

  constructor(request: Request) {
    this.#request = request;
  }

  #parse(mime: MIME) {
    if (this.#parsed) throw E.request_body_already_parsed();
    const raw = this.#request.headers.get("content-type") ?? "none";
    const content_type = raw.split(";")[0].trim().toLowerCase();
    assert.true(mime === content_type);
    this.#parsed = true;
  }

  json(): Promise<JSONValue> {
    this.#parse(http.MIME.APPLICATION_JSON);
    return this.#request.json();
  }

  async form(): Promise<Form> {
    this.#parse(http.MIME.APPLICATION_X_WWW_FORM_URLENCODED);
    const form: Form = Object.create(null);

    for (const [key, value] of (await this.#request.formData()).entries()) {
      form[key] = assert.string(value);
    }

    return form;
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

    return { form, files };
  }

  text(): Promise<string> {
    this.#parse(http.MIME.TEXT_PLAIN);
    return this.#request.text();
  }

  blob(): Promise<Blob> {
    this.#parse(http.MIME.APPLICATION_OCTET_STREAM);
    return this.#request.blob();
  }
}
