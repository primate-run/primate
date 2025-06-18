import FileRef from "@rcompat/fs/FileRef";
import MaybePromise from "@rcompat/type/MaybePromise";
import assert from "@rcompat/invariant/assert";
import RequestFacade from "#RequestFacade";
import ResponseLike from "#ResponseLike";
import session from "#session/config";
import encodeSession from "#wasm/encode-session";
import encodeRequest from "#wasm/encode-request";
import decodeResponse from "#wasm/decode-response";
import decodeJson from "#wasm/decode-json";
import decodeWebsocketSendMessage from "./decode-websocket-send.js";
import decodeWebsocketClose from "./decode-websocket-close.js";
import text from "#handler/text";

/** A helper function to encourage type safety when working with wasm pointers, tagging them as a specific type. */
type Tagged<Name, T> = { _tag: Name; } & T;

/** The HTTP methods supported by Primate. */
const methods = ["get", "head", "post", "put", "delete", "connect", "options", "trace", "patch"] as const;
type HTTPMethod = typeof methods[number];

/** A request handler function type. */
type RequestHandler = (request: RequestFacade) => MaybePromise<ResponseLike>;

type ServerWebSocket = {
  send(value: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  close(code?: number, reason?: string): void;
}

/** The default request and response types, which are likely pointers into a WASM linear memory space. */
type I32 = number;

/** The API that Primate exposes to the WASM module. */
export type API = {
  [Method in HTTPMethod]?: MaybePromise<RequestHandler>;
};

/** The HTTP Methods that are potentially exported by the WASM module if they are following the Primate WASM ABI convention. */
export type ExportedMethods<TRequest = I32, TResponse = I32> = {
  [Method in HTTPMethod]?: (request: Tagged<"Request", TRequest>) => Tagged<"Response", TResponse>;
};
WebSocket
/** These functions should be exported by a WASM module to be compatible with Primate. This follows the Primate WASM ABI convention. */
export type PrimateWasmExports<TRequest = I32, TResponse = I32> = {
  memory: WebAssembly.Memory;
  newRequest(): Tagged<"Request", TRequest>;
  sendResponse(response: Tagged<"Response", TResponse>): void;
  finalizeRequest(value: Tagged<"Request", TRequest>): void;
  finalizeResponse(value: Tagged<"Response", TResponse>): void;
  websocketOpen(): void;
  websocketClose(): void;
  websocketMessage(): void;
} & ExportedMethods<TRequest, TResponse>;

export type Instantiation<TRequest = I32, TResponse = I32> = {
  api: API;
  sockets: Map<bigint, any>,
  memory: WebAssembly.Memory;
  exports: PrimateWasmExports<TRequest, TResponse>;
  setPayload(value: Uint8Array): void;
};

/**
 * Instantiate a WASM module from a file reference and the given web assembly imports..
 * 
 * @param ref - The file reference to the WASM module.
 * @param imports - The imports to pass to the WASM module when instantiating it.
 * @returns - The instantiated WASM module, its exports, and the API that Primate exposes to the WASM module.
 */
const instantiate = async <TRequest = I32, TResponse = I32>(ref: FileRef, imports: WebAssembly.Imports = {}) => {
  // default payload is set to an empty buffer via setPayloadBuffer
  let payload = new Uint8Array(0) as Uint8Array;
  let received = new Uint8Array(0) as Uint8Array;
  const setPayload = (value: Uint8Array) => {
    payload = value;
  };

  const sockets = new Map<bigint, ServerWebSocket>();

  /**
   * The imports that Primate provides to the WASM module. This follows the Primate WASM ABI convention.
   */
  const primateImports = {
    /**
     * Create a new session and set it as the current session. This method should only be called after
     * a JSON payload has been received via the `send` function.
     * 
     * Once the session has been created, the `payload` should be set to the encoded session, and then
     * `payloadByteLength` and `receive` should be called to send the payload to the WASM module.
     */
    newSession() {
      const data = decodeJson.from(received);
      session().create(data);
      const newSession = session();
      payload = encodeSession(newSession);
    },

    /**
     * Get the current session and set it as the payload. This method should only be called after
     * a JSON payload has been received via the `send` function.
     */
    getSession() {
      const currentSession = session();
      const encodedSession = encodeSession(currentSession);
      payload = encodedSession;
    },

    /**
     * Send the current active payload to the WASM module.
     * 
     * @param ptr The pointer to where the payload should be written into the WASM linear memory space.
     * @param length The length of the payload. This must match the actual payload length, otherwise an exception will be thrown.
     */
    receive(ptr: number, length: number) {
      assert(payload.length === length, "Payload length mismatch");
      const wasmBuffer = new Uint8Array(memory.buffer, ptr, length);
      wasmBuffer.set(payload);
    },

    /**
     * Get the length of the current active payload.
     * 
     * @returns The length of the payload.
     */
    payloadByteLength() {
      return payload.byteLength;
    },

    /**
     * Send a payload from the WASM module to Primate.
     * 
     * @param ptr The pointer to the payload in the WASM linear memory space.
     * @param length The length of the payload.
     */
    send(ptr: number, length: number) {
      const wasmBuffer = new Uint8Array(memory.buffer, ptr, length);
      const output = new Uint8Array(length);
      output.set(wasmBuffer);
      received = output;
    },

    /**
     * Send a WebSocket message to a given socket by it's id.
     */
    websocketSend() {
      const { id, message } = decodeWebsocketSendMessage(payload);
      assert(sockets.has(id), "Invalid socket id. Was the socket already closed?");
      const socket = sockets.get(id)!;
      socket.send(message);
    },

    /**
     * Close a WebSocket.
     */
    websocketClose() {
      const { id } = decodeWebsocketClose(payload);
      

    }
  };

  const bytes = await ref.arrayBuffer();

  const instantiateDeno = async () => {
    // @ts-expect-error: for deno, need to implement the std lib implementation
    const Context = await import("https://deno.land/std@0.92.0/wasi/snapshot_preview1.ts");
    const context = new Context({
      args: Deno.args,
      env: Deno.env.toObject(),
      preopens: {"./":"./"}
    });

    const instance = await WebAssembly.instantiate(bytes, {
      ...imports,
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
      bytes,
      {
        ...imports,
        "wasi_snapshot_preview1": wasiSnapshotPreview1.wasiImport,
        "primate": primateImports,
      },
    );
    // start the wasi instance
    wasiSnapshotPreview1.start(wasm.instance);
    return wasm;
  };

  const wasm = typeof Deno !== "undefined"
    ? await instantiateDeno()
    : await defaultInstantiate();

  const exports = wasm.instance.exports as unknown as PrimateWasmExports<TRequest, TResponse>;
  const memory = exports.memory;

  const api = {} as API;
  const instance = { setPayload, api, memory, exports, sockets } as Instantiation<TRequest, TResponse>;
  for (const method of methods) {
    if (method in exports && typeof exports[method] === "function") {
      const methodFunc = (request: Tagged<"Request", TRequest>) => exports[method]!(request) as Tagged<"Response", TResponse>;
      
      api[method] = async (request: RequestFacade): Promise<ResponseLike> => {
        // payload is now set
        payload = await encodeRequest(request);
        // immediately tell the wasm module to obtain the payload and create a request
        const wasmRequest = exports.newRequest();
        
        // call the http method and obtain the response, finalizing the request
        const wasmResponse = methodFunc(wasmRequest);
        exports.finalizeRequest(wasmRequest);

        // @ts-ignore
        const view = new Uint32Array(memory.buffer, wasmResponse - 8, 10);
        
        // send the response to the wasm module and decode the response, finalizing the response
        exports.sendResponse(wasmResponse);
        console.log(Array.from(view).map(e => e.toString(16)).join(" "));
        const response = decodeResponse(received);
        exports.finalizeResponse(wasmResponse);

        if (response.type === "web_socket_upgrade") {
          return response.callback(instance);
        }

        if (response.type === "text") {
          return text(response.text, {
            status: response.status,
            headers: response.headers,
          });
        }

        return response.value;
      }
    }
  }

  return instance;
}

export default instantiate;
