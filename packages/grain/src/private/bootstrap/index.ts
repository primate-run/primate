import FileRef from "@rcompat/fs/FileRef";
import * as assert from "node:assert/strict";
import RequestFacade from "@primate/core/RequestFacade";
import ResponseLike from "@primate/core/ResponseLike";
import error from "@primate/core/handler/error";
import redirect from "@primate/core/handler/redirect";
import session from "@primate/core/config/session";
import encodeSession from "@primate/core/wasm/encode-session";
import encodeRequest from "@primate/core/wasm/encode-request";
import decodeResponse from "@primate/core/wasm/decode-response";

type Tagged<Name, T> = { _tag: Name; } & T;

type GrainRequest = Tagged<"Request", bigint>;
type GrainResponse = Tagged<"Response", bigint>;

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
  _sendResponse(response: GrainResponse): void;
  _finishRequest(request: GrainRequest): void;
} & Partial<Record<HTTPMethod, (request: GrainRequest) => GrainResponse>>;

let payload: Uint8Array;
let payloadView: DataView;

const setPayloadBuffer = (buffer: Uint8Array) => {
  payload = buffer;
  payloadView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

let received = new Uint8Array(0);

const decoder = new TextDecoder();

const primateImports = {
  newSessionPayload() {
    const data = decoder.decode(received);
    const json = JSON.parse(data);
    session().create(json);
    const newSession = session();
    const encodedSession = encodeSession(newSession) 

    setPayloadBuffer(encodedSession);
  },
  getSessionPayload() {
    const currentSession = session()
    const encodedSession = encodeSession(currentSession) 
    setPayloadBuffer(encodedSession);
  },
  payloadReceive(ptr: number, length: number) {
    assert.ok(payload, "Invalid payload index");
    assert.ok(payload.length === length, "Payload length mismatch");
    const wasmBuffer = new Uint8Array(memory.buffer, ptr, length);
    wasmBuffer.set(payload);
  },
  payloadGetLength() {
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

const wasmPath = FileRef.join(import.meta.dirname, "__FILE_NAME__");

const instantiateDeno = async () => {
  // @ts-expect-error: for deno, need to implement the std lib implementation
  const Context = await import("https://deno.land/std@0.92.0/wasi/snapshot_preview1.ts");
  const context = new Context({
    args: Deno.args,
    env: Deno.env.toObject(),
    preopens: {"./":"./"}
  });
  const binary = await Deno.readFile(wasmPath.path);
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
      ? await Bun.file(wasmPath.path).arrayBuffer()
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

const api = {} as API;

for (const method of methods) {
  if (method in exports && typeof exports[method] === "function") {
    const methodFunc = (request: GrainRequest) => exports[method]!(request);
    
    api[method] = async (request: RequestFacade): Promise<ResponseLike> => {
      // payload is now set
      setPayloadBuffer(await encodeRequest(request));
      console.log("Payload", payload);

      const grainRequest = exports._makeRequest();
      console.log("Request is", grainRequest);

      const grainResponse = methodFunc(grainRequest);
      console.log("Response is", grainResponse);

      exports._sendResponse(grainResponse);
      const response = decodeResponse(received);
      console.log("Response is", response);

      // response is now set
      exports._finishRequest(grainRequest);
      return response;
    }
  }
}

console.log(api);

export { api as default }
