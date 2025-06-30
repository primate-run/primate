import RequestFacade from "#RequestFacade";
import assert from "@rcompat/assert";
import PartialDictionary from "@rcompat/type/PartialDictionary";
import sizeOfUrl from "./size-of-url.js";
import sizeOfString from "./size-of-string.js";
import sizeOfFile from "./size-of-file.js";
import encodeString from "./encode-string.js";
import encodeURL from "./encode-url.js";
import encodeStringMap from "./encode-string-map.js";
import BufferView from "@rcompat/bufferview";

type Body = RequestFacade["body"];


const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;
const SECTION_HEADER_SIZE = SIZE_I32;

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


const sizeOfUrlSection = (url: URL) => SECTION_HEADER_SIZE + sizeOfUrl(url);
const sizeOfBodySection = (body: Body) => {
  if (body === null)
    return SECTION_HEADER_SIZE
      + SIZE_I32; // 0 kind null

  if (typeof body === "string")
    return SECTION_HEADER_SIZE
      + SIZE_I32 // 1 kind string
      + sizeOfString(body);

  if (typeof body === "object") {
    let size = SECTION_HEADER_SIZE
      + SIZE_I32 // 2 kind map
      + SIZE_I32; // entryCount

    for (const [key, value] of Object.entries(body)) {
      size += sizeOfString(key);
      size += SIZE_I32 // valueKind
        + (
          typeof value === "string"
            ? sizeOfString(value)
            : sizeOfFile(value)
        )
    }

    return size;
  }
  
  throw new Error("Invalid RequestLike body");
}

const sizeOfMapSection = (map: PartialDictionary<string>) => {
  let size = SECTION_HEADER_SIZE + SIZE_I32;

  for (const [key, value] of Object.entries(map)) {
    if (value) {
      size += sizeOfString(key) + sizeOfString(value);
    }
  }

  return size;
}

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
 * @param bufferView - The buffer view to encode the map into.
 */
const encodeMapSection = (header: number, map: PartialDictionary<string>, bufferView: BufferView) => {
  bufferView.writeU32(header);
  return encodeStringMap(map, bufferView);
};

const encodeFile = async (file: File, bufferView: BufferView) => {
  const byteLength = file.size;
  bufferView.writeU32(byteLength);

  const bytes = await file.bytes();
  bufferView.writeBytes(bytes);
}

/**
 * 1. Section 1: URI
 *   - [Section Header: 0] 4 bytes
 *   - [I32: length] 4 bytes
 *   - [...payload] length bytes
 */
const encodeSectionUrl = (url: URL, bufferView: BufferView) => {
  bufferView.writeU32(URL_SECTION);
  encodeURL(url, bufferView);
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
const encodeSectionBody = async (body: Body, bufferView: BufferView) => {
  bufferView.writeU32(BODY_SECTION);

  if (typeof body === "string") {
    bufferView.writeU32(BODY_KIND_STRING);
    encodeString(body, bufferView);
    return;
  }

  if (typeof body === "object" && body !== null) {
    const entries = Object.entries(body);
    const entryCount = entries.length;

    bufferView.writeU32(BODY_KIND_MAP);
    bufferView.writeU32(entryCount);

    for (const [key, value] of Object.entries(body)) {
      encodeString(key, bufferView);

      if (typeof value === "string") {
        bufferView.writeU32(BODY_KIND_MAP_VALUE_STRING);
        encodeString(value, bufferView);
      } else {
        bufferView.writeU32(BODY_KIND_MAP_VALUE_BYTES);
        await encodeFile(value, bufferView);
      }
    }
  }
  
  if (body === null || body === void 0) {
    bufferView.writeU32(BODY_KIND_NULL);
    return;
  }

  throw new Error(`Unsupported body type: ${typeof body}`);
}

const sizeOfRequest = (request: RequestFacade) => sizeOfUrlSection(request.url)
  + sizeOfBodySection(request.body)
  + sizeOfMapSection(request.path)
  + sizeOfMapSection(request.query)
  + sizeOfMapSection(request.headers)
  + sizeOfMapSection(request.cookies);

const encodeRequestInto = async (request: RequestFacade, bufferView: BufferView) => {
  encodeSectionUrl(request.url, bufferView);
  await encodeSectionBody(request.body, bufferView);
  encodeMapSection(PATH_SECTION, request.path, bufferView);
  encodeMapSection(QUERY_SECTION, request.query, bufferView);
  encodeMapSection(HEADERS_SECTION, request.headers, bufferView);
  encodeMapSection(COOKIES_SECTION, request.cookies, bufferView);
}

const encodeRequest = async (request: RequestFacade) => {
  const size = sizeOfRequest(request);
  const output = new Uint8Array(size);
  const bufferView = new BufferView(output);
  await encodeRequestInto(request, bufferView);
  return output;
}

encodeRequest.sizeOf = sizeOfRequest;
encodeRequest.into = encodeRequestInto;

export default encodeRequest;
