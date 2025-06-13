import RequestFacade from "#RequestFacade";
import * as assert from "node:assert/strict";
import toBufferView from "./to-buffer-view.js";
import PartialDictionary from "@rcompat/type/PartialDictionary";

type Body = RequestFacade["body"];
type BufferView = ReturnType<typeof toBufferView>;

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

const encoder = new TextEncoder();

function utf8ByteLength(str: string) {
  let length = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i)!;
    if (code <= 0x7f) {
      length += 1;
    } else if (code <= 0x7ff) {
      length += 2;
    } else if (code <= 0xffff) {
      length += 3;
    } else if (code <= 0x10ffff) {
      length += 4;
    }

    // Strings in js have 16 bits long character sequences, and when
    // the codepoint is above 0x10000, it requires 2 values
    // in the string, and "i" should be advanced again to skip
    // over the second codepoint in the sequence
    if (code >= 0x10000) i++;
  }
  return length;
}

const writeUInt32LE = (value: number, offset: number, view: DataView) => {
  assert.ok(view.byteLength >= offset + 4)
  view.setUint32(offset, value, true);
  return offset + 4;
};

const sizeOfString = (str: string) => utf8ByteLength(str) + 4;
const sizeOfUrl = (url: URL) => sizeOfString(url.toString());
const sizeOfFile = (file: File) => file.size + SIZE_I32;

const sizeOfUrlSection = (url: URL) => SECTION_HEADER_SIZE + sizeOfUrl(url);
const sizeOfBodySection = (body: Body) => {
  if (body === null)
    return SECTION_HEADER_SIZE
      + SIZE_I32; // 0

  if (typeof body === "string")
    return SECTION_HEADER_SIZE
      + SIZE_I32 // 1
      + sizeOfString(body);

  if (typeof body === "object") {
    let size = SECTION_HEADER_SIZE
      + SIZE_I32 // 2;
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
const encodeMapSection = (header: number, map: PartialDictionary<string>, offset: number, bufferView: BufferView) => {
  offset = encodeUint32LE(header, offset, bufferView);

  // only "set" entries are allowed
  const entries = Object.entries(map).filter(([, value]) => Boolean(value));
  const count = entries.length;

  offset = encodeUint32LE(count, offset, bufferView);

  for (const [key, value] of entries) {
    offset = encodeString(key, offset, bufferView);
    offset = encodeString(value!, offset, bufferView);
  }

  return offset;
};

const encodeFile = async (file: File, offset: number, bufferView: BufferView) => {
  const byteLength = file.size;
  offset = encodeUint32LE(byteLength, offset, bufferView);

  const next = offset + byteLength;
  assert.ok(next <= bufferView.byteLength, "Buffer overflow.");
  bufferView.buffer.set(await file.bytes(), offset);
  return next;
}

/**
 * Encode a single 4 byte integer into a buffer view.
 * 
 * @param value - The value.
 * @param offset - The offset to encode the value at.
 * @param bufferView - The buffer view to encode the value into.
 * @returns - The next offset.
 */
const encodeUint32LE = (value: number, offset: number, bufferView: BufferView) => {
  const next = offset + SIZE_I32;
  assert.ok(next <= bufferView.byteLength, "Buffer overflow.");
  bufferView.view.setUint32(offset, value, true);
  return next;
}

/**
 * Encoding a string has the following format:
 * - I32: length
 * - U8[length]: bytes
 * 
 * @param str - The string to encode
 * @param offset - The offset to encode the string at.
 * @param bufferView - The buffer view to encode the string into.
 * @returns The next offset.
 */
const encodeString = (str: string, offset: number, bufferView: BufferView) => {
  const byteLength = utf8ByteLength(str);
  offset = encodeUint32LE(byteLength, offset, bufferView);
  const next = offset + byteLength;
  assert.ok(next <= bufferView.byteLength, "Buffer overflow.");
  encoder.encodeInto(str, bufferView.buffer.subarray(offset, offset + byteLength));
  return next;
}

/**
 * Encode a url as a string into a bufferView.
 * 
 * @param url - The url to encode.
 * @param offset - The offset to encode the url at.
 * @param bufferView - The buffer view to encode the url into.
 * @returns The next offset.
 */
const encodeURL = (url: URL, offset: number, bufferView: BufferView) => {
  const str = url.toString();
  return encodeString(str, offset, bufferView);
}

/**
 * 1. Section 1: URI
 *   - [Section Header: 0] 4 bytes
 *   - [I32: length] 4 bytes
 *   - [...payload] length bytes
 */
const encodeSectionUrl = (url: URL, offset: number, bufferView: BufferView) => {
  offset = encodeUint32LE(URL_SECTION, offset, bufferView);
  return encodeURL(url, offset, bufferView);
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
const encodeSectionBody = async (body: Body, offset: number, bufferView: BufferView) => {
  offset = writeUInt32LE(BODY_SECTION, offset, bufferView.view);

  if (typeof body === "string") {
    offset = encodeUint32LE(BODY_KIND_STRING, offset, bufferView);
    return encodeString(body, offset, bufferView);
  }

  if (typeof body === "object" && body !== null) {
    const entries = Object.entries(body);
    const entryCount = entries.length;

    offset = encodeUint32LE(BODY_KIND_MAP, offset, bufferView);
    offset = encodeUint32LE(entryCount, offset, bufferView);

    for (const [key, value] of Object.entries(body)) {
      offset = encodeString(key, offset, bufferView);

      if (typeof value === "string") {
        offset = encodeUint32LE(BODY_KIND_MAP_VALUE_STRING, offset, bufferView);
        offset = encodeString(value, offset, bufferView);
      } else {
        offset = encodeUint32LE(BODY_KIND_MAP_VALUE_BYTES, offset, bufferView);
        offset = await encodeFile(value, offset, bufferView);
      }
    }

    return offset;
  }
  
  if (body === null || body === void 0)
    return encodeUint32LE(BODY_KIND_NULL, offset, bufferView);

  throw new Error(`Unsupported body type: ${typeof body}`);
}

const sizeOfRequest = (request: RequestFacade) => sizeOfUrlSection(request.url)
  + sizeOfBodySection(request.body)
  + sizeOfMapSection(request.path)
  + sizeOfMapSection(request.query)
  + sizeOfMapSection(request.headers)
  + sizeOfMapSection(request.cookies);

type BufferViewSource = Parameters<typeof toBufferView>[0];

const encodeRequestInto = async (request: RequestFacade, offset: number, target: BufferViewSource) => {
  assert.ok(offset + sizeOfRequest(request) <= target.byteLength, "Buffer overflow.");

  const bufferView = toBufferView(target);

  offset = encodeSectionUrl(request.url, offset, bufferView);
  offset = await encodeSectionBody(request.body, offset, bufferView);
  offset = encodeMapSection(PATH_SECTION, request.path, offset, bufferView);
  offset = encodeMapSection(QUERY_SECTION, request.query, offset, bufferView);
  offset = encodeMapSection(HEADERS_SECTION, request.headers, offset, bufferView);
  offset = encodeMapSection(COOKIES_SECTION, request.cookies, offset, bufferView);

  assert.ok(offset === bufferView.byteLength, "Invalid encoding. Something is wrong with the encoder.");
}

const encodeRequest = async (request: RequestFacade) => {
  const size = sizeOfRequest(request);
  const output = new Uint8Array(size);
  await encodeRequestInto(request, 0, output);
  return output;
}

encodeRequest.sizeOf = sizeOfRequest;
encodeRequest.into = encodeRequestInto;

export default encodeRequest;
