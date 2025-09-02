import type RequestBody from "#request/RequestBody";
import type RequestFacade from "#request/RequestFacade";
import encodeString from "#wasm/encode-string";
import encodeStringMap from "#wasm/encode-string-map";
import encodeURL from "#wasm/encode-url";
import filesize from "#wasm/filesize";
import I32_SIZE from "#wasm/I32_SIZE";
import stringSize from "#wasm/stringsize";
import urlSize from "#wasm/urlsize";
import BufferView from "@rcompat/bufferview";
import type PartialDict from "@rcompat/type/PartialDict";
import encodeBuffer from "./encode-buffer.js";
import MaybePromise from "@rcompat/type/MaybePromise";

const SECTION_HEADER_SIZE = I32_SIZE;

const URL_SECTION = 0;
const BODY_SECTION = 1;
const PATH_SECTION = 2;
const QUERY_SECTION = 3;
const HEADERS_SECTION = 4;
const COOKIES_SECTION = 5;

const BODY_KIND_NULL = 0;
const BODY_KIND_TEXT = 1;
const BODY_KIND_FIELDS = 2;
const BODY_KIND_BINARY = 3;
const BODY_KIND_JSON = 4;

const BODY_KIND_MAP_VALUE_STRING = 0;
const BODY_KIND_MAP_VALUE_BLOB = 1;

const sizeOfUrlSection = (url: URL) => SECTION_HEADER_SIZE + urlSize(url);
const sizeOfBodySection = (body: RequestBody) => {
  let size = SECTION_HEADER_SIZE + I32_SIZE;

  if (body === null || body.type === "none")
    return size; // 0 kind null

  if (body.type === "text")
    return size + stringSize(body.text());

  if (body.type === "fields") {
    size += I32_SIZE; // entry count

    const fields = body.fields();

    for (const [key, value] of Object.entries(fields)) {
      size += stringSize(key);
      size += I32_SIZE // value kind
        + (
          typeof value === "string"
            ? stringSize(value)
            : filesize(value)
        );
    }

    return size;
  }

  if (body.type === "binary") {
    const bin = body.binary();
    size += stringSize(bin.type);
    size += I32_SIZE + bin.size;

    return size;
  }

  if (body.type === "json") {
    const json = body.json();
    size += stringSize(JSON.stringify(json));
    return size;
  }

  throw new Error("Invalid RequestLike body");
};

const sizeOfMapSection = (map: PartialDict<string>) => {
  let size = SECTION_HEADER_SIZE + I32_SIZE;

  for (const [key, value] of Object.entries(map)) {
    if (value) {
      size += stringSize(key) + stringSize(value);
    }
  }

  return size;
};

/**
 * Encode a map of Key Value pairs into a section.
 *
 * - [I32: header]
 * - [I32: count]
 * - Entries[count]:
 *   - [String: key]
 *   - [String: value]
 *
 * @param header - The header for this section.
 * @param map - The map itself to be encoded.
 * @param offset - The offset to encode the map at.
 * @param view - The buffer view to encode the map into.
 */
const encodeMapSection = (header: number, map: PartialDict<string>, view: BufferView) => {
  view.writeU32(header);
  return encodeStringMap(map, view);
};

type BlobLike = {
  type: string;
  bytes(): MaybePromise<Uint8Array>;
}

type FileLike = {
  name: string;
  type: string;
  bytes(): MaybePromise<Uint8Array>;
}

const encodeBlob = async (file: BlobLike, view: BufferView) => {
  const type = file.type;
  const bytes = await file.bytes();
  encodeString(type, view);
  view.writeU32(bytes.byteLength);
  view.writeBytes(bytes);
};

const encodeFile = async (file: FileLike, view: BufferView) => {
  const name = file.name;
  const type = file.type;
  const bytes = await file.bytes();

  encodeString(name, view);
  encodeString(type, view);
  view.writeU32(bytes.byteLength);
  view.writeBytes(bytes);
};

/**
 * 1. Section 1: URI
 *   - [Section Header: 0] 4 bytes
 *   - [I32: length] 4 bytes
 *   - [...payload] length bytes
 */
const encodeSectionUrl = (url: URL, view: BufferView) => {
  view.writeU32(URL_SECTION);
  encodeURL(url, view);
};

/**
 * 2. Section 2: Body
 *   - [Section Header: 1] 4 bytes
 *   - [kind: I32] 4 bytes
 *     - 0: Null
 *       - [I32: kind = 0] 4 bytes
 *     - 1: String
 *       - [I32: kind = 1] 4 bytes
 *       - [I32: length] 4 bytes
 *       - [...payload] length bytes
 *     - 2: Map<string, string | file>
 *       - [I32: kind = 2] 4 bytes
 *       - [I32: count] 4 bytes
 *       - [String, String | FileDescriptor]
 *         - [I32: key length]
 *         - [...key payload]
 *         - [I32: value kind] 4 bytes
 *           - 0: String
 *             - [I32: value kind = 0] 4 bytes
 *             - [I32: value length] 4 bytes
 *             - [...value payload] value length bytes
 *           - 1: File
 *             - [I32: value kind = 1] 4 bytes
 *             - [I32: file_descriptor] 4 bytes
 */
const encodeSectionBody = async (body: RequestBody, view: BufferView) => {
  view.writeU32(BODY_SECTION);
  
  if (body.type === "text") {
    const text = body.text();
    view.writeU32(BODY_KIND_TEXT);
    encodeString(text, view);
  } else if (body.type === "fields") {
    const fields = body.fields();
    const entries = Object.entries(body.fields());
    const entryCount = entries.length;

    view.writeU32(BODY_KIND_FIELDS);
    view.writeU32(entryCount);

    for (const [key, value] of Object.entries(fields)) {
      encodeString(key, view);

      if (typeof value === "string") {
        view.writeU32(BODY_KIND_MAP_VALUE_STRING);
        encodeString(value, view);
      } else {
        view.writeU32(BODY_KIND_MAP_VALUE_BLOB);
        await encodeFile(value, view);
      }
    }
  } else if (body.type === "binary") {
    view.writeU32(BODY_KIND_BINARY);
    encodeBlob(body.binary(), view);
  } else if (body.type === "json") {
    view.writeU32(BODY_KIND_JSON);
    const jsonText = JSON.stringify(body.json());
    encodeString(jsonText, view);
  } else if (body === null || body === void 0 || body.type === "none") {
    view.writeU32(BODY_KIND_NULL);
  } else {
    throw new Error(`Unsupported body type: ${body?.type ?? typeof body}`);
  }
};

const sizeOfRequest = (request: RequestFacade) => sizeOfUrlSection(request.url)
  + sizeOfBodySection(request.body)
  + sizeOfMapSection(request.path.toJSON())
  + sizeOfMapSection(request.query.toJSON())
  + sizeOfMapSection(request.headers.toJSON())
  + sizeOfMapSection(request.cookies.toJSON());

const encodeRequestInto = async (request: RequestFacade, view: BufferView) => {
  encodeSectionUrl(request.url, view);
  await encodeSectionBody(request.body, view);
  encodeMapSection(PATH_SECTION, request.path.toJSON(), view);
  encodeMapSection(QUERY_SECTION, request.query.toJSON(), view);
  encodeMapSection(HEADERS_SECTION, request.headers.toJSON(), view);
  encodeMapSection(COOKIES_SECTION, request.cookies.toJSON(), view);
};

const encodeRequest = async (request: RequestFacade) => {
  const size = sizeOfRequest(request);
  const output = new Uint8Array(size);
  const bufferView = new BufferView(output);
  await encodeRequestInto(request, bufferView);
  return output;
};

encodeRequest.sizeOf = sizeOfRequest;
encodeRequest.into = encodeRequestInto;

export default encodeRequest;
