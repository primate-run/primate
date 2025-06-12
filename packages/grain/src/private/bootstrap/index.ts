import FileRef from "@rcompat/fs/FileRef";
import * as wasi from "node:wasi";
import * as assert from "node:assert/strict";
import RequestFacade from "@primate/core/RequestFacade";
import ResponseLike from "@primate/core/ResponseLike";
import PartialDictionary from "@rcompat/type/PartialDictionary";


type Body = RequestFacade["body"];
type Tagged<Name, T> = { _tag: Name; } & T;

type GrainRequest = Tagged<"Request", number>;
type GrainResponse = Tagged<"Response", number>;
type GrainString = Tagged<"String", number>;
type GrainOption<T> = Tagged<"Option", number> & { _kind: T };
type PayloadLength = Tagged<"PayloadLength", number>;

type HTTPMethod =
  | "get"
  | "head"
  | "post"
  | "put"
  | "delete"
  | "connect"
  | "options"
  | "trace"
  | "patch"

const methods = ["get", "head", "post", "put", "delete", "connect", "options", "trace", "patch"] as const;

type API = {
  get?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
  head?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
  post?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
  put?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
  delete?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
  connect?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
  options?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
  trace?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
  patch?: (request: RequestFacade) => ResponseLike | Promise<ResponseLike> | undefined;
}

type PrimateWasmExports = {
  memory: WebAssembly.Memory;
  _makeRequest(length: PayloadLength): GrainRequest;
  _serializeResponse(response: GrainResponse): PayloadLength;
  _decRef(ref: number): void;
  _incRef(ref: number): void;
} & Partial<Record<HTTPMethod, (request: GrainRequest) => GrainResponse>>;

const wasiSnapshotPreview1 = new wasi.WASI({
  version: "preview1",
  env: process.env,
  args: process.argv,
});
const wasmPath = "./test.wasm";

let payload = Buffer.alloc(0);
let received = Buffer.alloc(0);

const wasm = await WebAssembly.instantiate(
  typeof Bun === "object"
    ? await Bun.file(wasmPath).arrayBuffer()
    : await FileRef.arrayBuffer(wasmPath),
    {
      "wasi_snapshot_preview1": wasiSnapshotPreview1.wasiImport,
      "primate": {
        payloadReceive(ptr: number, length: number) {
          assert.ok(payload, "Invalid payload index");
          const wasmBuffer = Buffer.from(memory.buffer, ptr, length);
          payload.copy(wasmBuffer, 0, 0, length);
        },
        payloadgGetLength() {
          assert.ok(payload, "Invalid payload index");
          return payload.byteLength;
        },
        sendPayload(ptr: number, length: number) {
          const wasmBuffer = Buffer.from(memory.buffer, ptr, length);
          const output = Buffer.alloc(length);
          wasmBuffer.copy(output, 0, 0, length);
          received = output;
        },
      },
    },
  );

  // obtain a reference to the wasm memory
const exports = wasm.instance.exports as unknown as PrimateWasmExports;
const memory = exports.memory;

// start the wasi instance
wasiSnapshotPreview1.start(wasm.instance);

const api = {} as API;

const SIZE_I32 = Int32Array.BYTES_PER_ELEMENT;
const SECTION_1 = 0;
const SECTION_2 = 1;
const SECTION_3 = 2;
const SECTION_4 = 3;
const SECTION_5 = 4;
const SECTION_6 = 5;

const BODY_NULL = 0;
const BODY_STRING = 1;
const BODY_MAP = 2;

const BODY_MAP_STRING = 0;
const BODY_MAP_FILE = 1;

/**
 * 1. Section 1: URI
 *   - [Section Header: 0] 4 bytes
 *   - [I32: length] 4 bytes
 *   - [...payload] length bytes
 */
const section1 = (url: URL) => {
  const urlString = url.toString();
  const size = 2 * SIZE_I32 + Buffer.byteLength(urlString);
  const payload = Buffer.alloc(size);
  payload.writeUInt32LE(SECTION_1, 0);
  payload.writeUInt32LE(Buffer.byteLength(urlString), SIZE_I32);
  payload.write(urlString, 2 * SIZE_I32);
  return payload;
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
const section2 = async (body: Body) => {
  if (typeof body === "string") {
    const size = 3 * SIZE_I32 + Buffer.byteLength(body);
    const payload = Buffer.alloc(size);
    payload.writeUInt32LE(SECTION_2, BODY_STRING);
    payload.writeUInt32LE(0, SIZE_I32);
    payload.writeUInt32LE(Buffer.byteLength(body), 2 * SIZE_I32);
    payload.write(body, 3 * SIZE_I32);
    return payload;
  }

  if (typeof body === "object" && body !== null) {
    let size = 3 * SIZE_I32;
    const entries = Object.entries(body)
    const count = entries.length;

    for (const [key, value] of entries) {
      size += 2 * SIZE_I32 + Buffer.byteLength(key) + 
        (
          typeof value === "string"
            ? Buffer.byteLength(value)
            : value.size
        );
    }
      
    const output = Buffer.alloc(size);
    let offset = 0;
    offset = output.writeUInt32LE(SECTION_2, offset);
    offset = output.writeUInt32LE(BODY_MAP, offset);
    offset = output.writeUInt32LE(count, offset);

    for (const [key, value] of entries) {
      const keyBufferLength = Buffer.byteLength(key);
      offset = output.writeUInt32LE(keyBufferLength, offset);
      offset += output.write(key, offset);
      if (typeof value === "string") {
        offset = output.writeUInt32LE(BODY_MAP_STRING, offset);
        const valueByteLength = Buffer.byteLength(value);
        offset = output.writeUInt32LE(valueByteLength, offset);
        offset += output.write(value, offset);
      } else {
        offset = output.writeUInt32LE(BODY_MAP_FILE, offset);
        offset = output.writeUInt32LE(value.size, offset);
        const valueBuffer = Buffer.from(await value.arrayBuffer());
        offset += valueBuffer.copy(output, offset);
      }
    }

    return output;
  }
  
  if (body === null || body === void 0) {
    const payload = Buffer.alloc(2 * SIZE_I32);
    payload.writeUInt32LE(SECTION_2, 0);
    payload.writeUInt32LE(BODY_NULL, SIZE_I32);
    return payload;
  }

  throw new Error(`Unsupported body type: ${typeof body}`);
}

/**
 * N. Section N: Dictionary
 *   - [Section Header: N - 1] 4 bytes
 *   - [I32: count] 4 bytes (count of key-value pairs)
 *   - [String, String] * count
 *      - [I32: key length]
 *      - [...key payload]
 *      - [I32: value length]
 *      - [...value payload]
 */
const dictionarySection = (id: number, dictionary: PartialDictionary<string>) => {
  let count = 0;
  // [header] [length] [count]
  let size = 2 * SIZE_I32;
  const entries = Object.entries(dictionary);

  for (const [key, value] of entries) {
    if (typeof value !== "string") continue;
    count += 1;
    size += 2 * SIZE_I32 + Buffer.byteLength(key) + Buffer.byteLength(value);
  }
  const output = Buffer.alloc(size);
  output.writeInt32LE(id, 0);
  output.writeInt32LE(count, SIZE_I32);

  let offset = 2 * SIZE_I32;
  for (const [key, value] of entries) {
    if (typeof value !== "string") continue;
    
    const keyBufferLength = Buffer.byteLength(key)
    offset = output.writeInt32LE(keyBufferLength, offset);
    offset += output.write(key, offset);
    const valueBufferLength = Buffer.byteLength(value);
    offset = output.writeInt32LE(valueBufferLength, offset);
    offset += output.write(value, offset);
  }

  return output;
}


const encodeRequest = async (request: RequestFacade) =>
  Buffer.concat([
    section1(request.url),
    await section2(request.body),
    dictionarySection(SECTION_3, request.path),
    dictionarySection(SECTION_4, request.query),
    dictionarySection(SECTION_5, request.headers),
    dictionarySection(SECTION_6, request.cookies),
  ]);

for (const method of methods) {
  if (method in exports && typeof exports[method] === "function") {
    const methodFunc = (request: GrainRequest) => exports[method]!(request);

    
    api[method] = async (request: RequestFacade): Promise<ResponseLike> => {
      payload = await encodeRequest(request);

      const grainRequest = exports._makeRequest(payload.byteLength as PayloadLength);

      const grainResponse = methodFunc(grainRequest);

      const response = decodeResponse(grainResponse);

      exports._decRef(grainRequest);
      exports._decRef(grainResponse);
      return response;
    }
  }
}

export default api;
