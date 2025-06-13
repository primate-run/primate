import FileRef from "@rcompat/fs/FileRef";
import * as assert from "node:assert/strict";
import RequestFacade from "@primate/core/RequestFacade";
import ResponseLike from "@primate/core/ResponseLike";
import PartialDictionary from "@rcompat/type/PartialDictionary";
import error from "@primate/core/handler/error";
import redirect from "@primate/core/handler/redirect";
import view from "@primate/core/handler/view";

type Body = RequestFacade["body"];
type Tagged<Name, T> = { _tag: Name; } & T;

type GrainRequest = Tagged<"Request", number>;
type GrainResponse = Tagged<"Response", number>;

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

type ErrorOptions = Parameters<typeof error>[0];
type Redirection = Exclude<Parameters<typeof redirect>[1], undefined>;

type Known = Exclude<Exclude<ErrorOptions, undefined>["status"], undefined>;

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
  _makeRequest(): GrainRequest;
  _serializeResponse(response: GrainResponse): void;
  _decRef(ref: number): void;
  _incRef(ref: number): void;
} & Partial<Record<HTTPMethod, (request: GrainRequest) => GrainResponse>>;

let payload: Uint8Array;
let payloadView: DataView;

const setPayloadBuffer = (buffer: Uint8Array) => {
  payload = buffer;
  payloadView = new DataView(payloadView.buffer, payloadView.byteOffset, payloadView.byteLength);
}

let received = new Uint8Array(0);

const primateImports = {
  payloadReceive(ptr: number, length: number) {
    assert.ok(payload, "Invalid payload index");
    assert.ok(payload.length === length, "Payload length mismatch");
    const wasmBuffer = new Uint8Array(memory.buffer, ptr, length);
    wasmBuffer.set(payload);
  },
  payloadgGetLength() {
    assert.ok(payload, "Invalid payload index");
    return payload.byteLength;
  },
  sendPayload(ptr: number, length: number) {
    const wasmBuffer = new Uint8Array(memory.buffer, ptr, length);
    const output = new Uint8Array(length);
    output.set(wasmBuffer);
    received = output;
  },
}

const wasmPath = "./__FILE_NAME__.wasm";

const instantiateDeno = async () => {
  // @ts-expect-error: for deno, need to implement the std lib implementation
  const Context = await import("https://deno.land/std@0.92.0/wasi/snapshot_preview1.ts");
  const context = new Context({
    args: Deno.args,
    env: Deno.env.toObject(),
    preopens: {"./":"./"}
  });
  const binary = await Deno.readFile("app.wasm");
  const instance = await WebAssembly.instantiate(binary, {
    "wasi_snapshot_preview1": context.exports,
    "primate": primateImports,
  });
  return instance;
}

const defaultInstantiate = async () => {
  const wasi = await import("node:wasi");
  const wasiSnapshotPreview1 = new wasi.WASI({
    version: "preview1",
    env: process.env,
    args: process.argv,
  });
  const wasm = await WebAssembly.instantiate(
    typeof Bun === "object"
      ? await Bun.file(wasmPath).arrayBuffer()
      : await FileRef.arrayBuffer(wasmPath),
    {
      "wasi_snapshot_preview1": wasiSnapshotPreview1.wasiImport,
      "primate": primateImports,
    },
  );
  // start the wasi instance
  wasiSnapshotPreview1.start(wasm.instance);
  return wasm;
}

const wasm = typeof Deno !== "undefined"
  ? await instantiateDeno()
  : await defaultInstantiate();

// obtain a reference to the wasm memory
const exports = wasm.instance.exports as unknown as PrimateWasmExports;
const memory = exports.memory;

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
const BODY_MAP_BYTES = 1;

const RESPONSE_STRING = 0;
const RESPONSE_JSON = 1;
const RESPONSE_BLOB = 2;
const RESPONSE_VIEW = 3;
const RESPONSE_ERROR = 4;
const RESPONSE_REDIRECT = 5;
const RESPONSE_URI = 6;

const NONE = 0;
const SOME = 1;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const readUint32LE = (offset: { ptr: number }, view: DataView) => {
  const next = offset.ptr + 4;
  assert.ok(next <= view.byteLength);
  const value = view.getUint32(offset.ptr, true);
  offset.ptr = next;
  return value;
}

const readBuffer = (offset: { ptr: number }, view: DataView) => {
  const bufferLengthPtr = offset.ptr;
  const bufferPtr = bufferLengthPtr + 4;
  
  // There must be more than 4 bytes here
  assert.ok(bufferPtr < view.byteLength);
  const bufferLength = view.getUint32(bufferLengthPtr, true);

  // Get the buffer from the view
  const next = bufferPtr + bufferLength;
  assert.ok(next <= view.byteLength);

  const buffer = new Uint8Array(view.buffer, view.byteOffset + bufferPtr, bufferLength);
  offset.ptr = next;
  return buffer;
}

const readString = (offset: { ptr: number }, view: DataView) => {
  const strLengthPtr = offset.ptr;
  const strPtr = strLengthPtr + 4;
  
  // There must be more than 4 bytes here
  assert.ok(strPtr < view.byteLength);
  const strLength = view.getUint32(strLengthPtr, true);

  // get the string from the view
  const next = strPtr + strLength;
  assert.ok(next <= view.byteLength);

  const str = decoder.decode(new Uint8Array(view.buffer, strPtr + view.byteOffset, strLength));
  offset.ptr = next;
  return str;
}

const decodeResponse = (response: GrainResponse) => {
  exports._serializeResponse(response);
  const payload = received;
  const payloadView = new DataView(payload.buffer);
  const offset = { ptr: 0 };

  const responseKind = readUint32LE(offset, payloadView);

  switch (responseKind) {
    case RESPONSE_STRING: {
      const value = readString(offset, payloadView);
      return value;
    }

    case RESPONSE_JSON: {
      const value = readString(offset, payloadView);
      return JSON.parse(value);
    }

    case RESPONSE_BLOB: {
      const buffer = readBuffer(offset, payloadView);
      const contentTypeKind = readUint32LE(offset, payloadView);

      if (contentTypeKind === SOME) {
        const contentType = readString(offset, payloadView);
        return new Blob([buffer], { type: contentType });
      }

      assert.ok(contentTypeKind === NONE);
      return new Blob([buffer]);
    }

    case RESPONSE_VIEW: {
      const viewId = readString(offset, payloadView);
      const props = JSON.parse(readString(offset, payloadView));
      const viewOptions = JSON.parse(readString(offset, payloadView));

      return view(viewId, props, viewOptions);
    }

    case RESPONSE_ERROR: {
      const bodyKind = readUint32LE(offset, payloadView);
      assert.ok(bodyKind === SOME || bodyKind === NONE);
      const body = bodyKind === SOME
        ? readString(offset, payloadView)
        : void 0;
      
      const statusCode = readUint32LE(offset, payloadView) as Known;

      const pageKind = readUint32LE(offset, payloadView);
      assert.ok(pageKind === SOME || pageKind === NONE);
      const page = bodyKind === SOME
        ? readString(offset, payloadView)
        : void 0;

      return error({
        body,
        status: statusCode,
        page,
      });
    }

    case RESPONSE_REDIRECT: {
      const to = readString(offset, payloadView);
      const statusKind = readUint32LE(offset, payloadView);
      assert.ok(statusKind === SOME || statusKind === NONE);

      const status = statusKind === SOME
        ? readUint32LE(offset, payloadView) as Redirection
        : void 0;
      
      return redirect(to, status);
    }

    case RESPONSE_URI: {
      const uri = readString(offset, payloadView);
      const url = new URL(uri);
      return url;
    }

    default:
      throw new Error("Invalid Response Payload.");
  }
}

const writeUInt32LE = (value: number, offset: number, view: DataView) => {
  assert.ok(view.byteLength >= offset + 4)
  view.setUint32(offset, value, true);
  return offset + 4;
};

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

const writeString = (value: string, offset: number, view: Uint8Array) => {
  const size = utf8ByteLength(value);
  const end = offset + size;
  assert.ok(view.byteLength >= end);
  encoder.encodeInto(value, view.subarray(offset, end));
  return end;
};

const writeUint8Array = (buffer: Uint8Array, offset: number, view: Uint8Array) => {
  const size = buffer.byteLength;
  const end = offset + size;
  assert.ok(view.byteLength >= end);
  view.subarray(offset, end).set(buffer);
  return end;
}

/**
 * 1. Section 1: URI
 *   - [Section Header: 0] 4 bytes
 *   - [I32: length] 4 bytes
 *   - [...payload] length bytes
 */
const section1 = (url: URL) => {
  const urlString = url.toString();
  const urlStringLength = utf8ByteLength(urlString);
  const size = 2 * SIZE_I32 + urlStringLength;
  const payload = new Uint8Array(size);
  const payloadView = new DataView(payload.buffer);

  let offset = writeUInt32LE(SECTION_1, 0, payloadView);
  offset = writeUInt32LE(urlStringLength, offset, payloadView);
  writeString(urlString, offset, payload);
  
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
    const bodySize = utf8ByteLength(body);
    const size = 3 * SIZE_I32 + bodySize;
    const payload = new Uint8Array(size);
    const payloadView = new DataView(payload.buffer);

    let offset = writeUInt32LE(SECTION_2, 0, payloadView);
    offset = writeUInt32LE(BODY_STRING, offset, payloadView);
    offset = writeUInt32LE(bodySize, offset, payloadView);
    writeString(body, offset, payload)
    return payload;
  }

  if (typeof body === "object" && body !== null) {
    let size = 3 * SIZE_I32;
    const entries = Object.entries(body)
    const count = entries.length;

    for (const [key, value] of entries) {
      size += 2 * SIZE_I32 + utf8ByteLength(key) + 
        (
          typeof value === "string"
            ? utf8ByteLength(value)
            : value.size
        );
    }
    
    const output = new Uint8Array(size);
    const outputView = new DataView(output.buffer);
    let offset = 0;
    offset = writeUInt32LE(SECTION_2, offset, outputView);
    offset = writeUInt32LE(BODY_MAP, offset, outputView);
    offset = writeUInt32LE(count, offset, outputView);

    for (const [key, value] of entries) {
      const keyBufferLength = utf8ByteLength(key);
      offset = writeUInt32LE(keyBufferLength, offset, outputView);
      offset = writeString(key, offset, output);

      if (typeof value === "string") {
        offset = writeUInt32LE(BODY_MAP_STRING, offset, outputView);
        const valueByteLength = utf8ByteLength(value);
        offset = writeUInt32LE(valueByteLength, offset, outputView);
        offset = writeString(value, offset, output);
      } else {
        offset = writeUInt32LE(BODY_MAP_BYTES, offset, outputView);
        offset = writeUInt32LE(value.size, offset, outputView);
        const valueBuffer = new Uint8Array(await value.arrayBuffer());
        offset = writeUint8Array(valueBuffer, offset, output);
      }
    }

    return output;
  }
  
  if (body === null || body === void 0) {
    const payload = new Uint8Array(2 * SIZE_I32);
    const payloadView = new DataView(payload.buffer);
    payloadView.setUint32(0, SECTION_2, true);
    payloadView.setUint32(SIZE_I32, BODY_NULL);
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
    size += 2 * SIZE_I32 + utf8ByteLength(key) + utf8ByteLength(value);
  }
  const output = new Uint8Array(size);
  const outputView = new DataView(output.buffer);
  let offset = 0;
  offset = writeUInt32LE(id, offset, outputView);
  offset = writeUInt32LE(count, offset, outputView);

  
  for (const [key, value] of entries) {
    if (typeof value !== "string") continue;
    
    const keyBufferLength = utf8ByteLength(key)
    offset = writeUInt32LE(keyBufferLength, offset, outputView);
    offset = writeString(key, offset, output);
    const valueBufferLength = utf8ByteLength(value);
    offset = writeUInt32LE(valueBufferLength, offset, outputView);
    offset = writeString(value, offset, output);
  }

  return output;
}

const encodeRequest = async (request: RequestFacade) => {
  const url = section1(request.url);
  const body = await section2(request.body);
  const path = dictionarySection(SECTION_3, request.path);
  const query = dictionarySection(SECTION_4, request.query);
  const headers = dictionarySection(SECTION_5, request.headers);
  const cookies = dictionarySection(SECTION_6, request.cookies);

  const size = url.byteLength
    + body.byteLength
    + path.byteLength
    + query.byteLength
    + headers.byteLength
    + cookies.byteLength;

  const payload = new Uint8Array(size);
  
  let offset = 0;
  offset = writeUint8Array(url, offset, payload);
  offset = writeUint8Array(body, offset, payload);
  offset = writeUint8Array(path, offset, payload);
  offset = writeUint8Array(query, offset, payload);
  offset = writeUint8Array(headers, offset, payload);
  offset = writeUint8Array(cookies, offset, payload);
  return payload;
}

const api = {} as API;

for (const method of methods) {
  if (method in exports && typeof exports[method] === "function") {
    const methodFunc = (request: GrainRequest) => exports[method]!(request);
    
    api[method] = async (request: RequestFacade): Promise<ResponseLike> => {
      payload = await encodeRequest(request);
      // payload is now set

      setPayloadBuffer(payload);
      const grainRequest = exports._makeRequest();
      const grainResponse = methodFunc(grainRequest);
      const response = decodeResponse(grainResponse);

      exports._decRef(grainRequest);
      exports._decRef(grainResponse);
      return response;
    }
  }
}

export default api;
