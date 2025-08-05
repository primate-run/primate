import type RequestFacade from "#RequestFacade";
import encodeString from "#wasm/encode-string";
import encodeStringMap from "#wasm/encode-string-map";
import encodeURL from "#wasm/encode-url";
import filesize from "#wasm/filesize";
import I32_SIZE from "#wasm/I32_SIZE";
import stringsize from "#wasm/stringsize";
import urlsize from "#wasm/urlsize";
import BufferView from "@rcompat/bufferview";
import type PartialDict from "@rcompat/type/PartialDict";

type Body = RequestFacade["body"];

const SECTION_HEADER_SIZE = I32_SIZE;

const URL_SECTION = 0;
const BODY_SECTION = 1;
const PATH_SECTION = 2;
const QUERY_SECTION = 3;
const HEADERS_SECTION = 4;
const COOKIES_SECTION = 5;

const BODY_KIND_NULL = 0;
const BODY_KIND_STRING = 1;
const BODY_KIND_MAP = 2;

const BODY_KIND_MAP_VALUE_STRING = 0;
const BODY_KIND_MAP_VALUE_BYTES = 1;

const sizeOfUrlSection = (url: URL) => SECTION_HEADER_SIZE + urlsize(url);
const sizeOfBodySection = (body: Body) => {
  if (body === null)
    return SECTION_HEADER_SIZE
      + I32_SIZE; // 0 kind null

  if (typeof body === "string")
    return SECTION_HEADER_SIZE
      + I32_SIZE // 1 kind string
      + stringsize(body);

  if (typeof body === "object") {
    let size = SECTION_HEADER_SIZE
      + I32_SIZE // 2 kind map
      + I32_SIZE // entry count
      ;

    for (const [key, value] of Object.entries(body)) {
      size += stringsize(key);
      size += I32_SIZE // value kind
        + (
          typeof value === "string"
            ? stringsize(value)
            : filesize(value)
        );
    }

    return size;
  }

  throw new Error("Invalid RequestLike body");
};

const sizeOfMapSection = (map: PartialDict<string>) => {
  let size = SECTION_HEADER_SIZE + I32_SIZE;

  for (const [key, value] of Object.entries(map)) {
    if (value) {
      size += stringsize(key) + stringsize(value);
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

const encodeFile = async (file: File, view: BufferView) => {
  const byteLength = file.size;
  view.writeU32(byteLength);

  const bytes = await file.bytes();
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
const encodeSectionBody = async (body: Body, view: BufferView) => {
  view.writeU32(BODY_SECTION);

  if (typeof body === "string") {
    view.writeU32(BODY_KIND_STRING);
    encodeString(body, view);
    return;
  }

  if (typeof body === "object" && body !== null) {
    const entries = Object.entries(body);
    const entryCount = entries.length;

    view.writeU32(BODY_KIND_MAP);
    view.writeU32(entryCount);

    for (const [key, value] of Object.entries(body)) {
      encodeString(key, view);

      if (typeof value === "string") {
        view.writeU32(BODY_KIND_MAP_VALUE_STRING);
        encodeString(value, view);
      } else {
        view.writeU32(BODY_KIND_MAP_VALUE_BYTES);
        await encodeFile(value, view);
      }
    }
  }

  if (body === null || body === void 0) {
    view.writeU32(BODY_KIND_NULL);
    return;
  }

  throw new Error(`Unsupported body type: ${typeof body}`);
};

const sizeOfRequest = (request: RequestFacade) => sizeOfUrlSection(request.url)
  + sizeOfBodySection(request.body)
  + sizeOfMapSection(request.path)
  + sizeOfMapSection(request.query)
  + sizeOfMapSection(request.headers)
  + sizeOfMapSection(request.cookies);

const encodeRequestInto = async (request: RequestFacade, view: BufferView) => {
  encodeSectionUrl(request.url, view);
  await encodeSectionBody(request.body, view);
  encodeMapSection(PATH_SECTION, request.path, view);
  encodeMapSection(QUERY_SECTION, request.query, view);
  encodeMapSection(HEADERS_SECTION, request.headers, view);
  encodeMapSection(COOKIES_SECTION, request.cookies, view);
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
