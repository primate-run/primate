import text from "#handler/text";
import type RequestFacade from "#RequestFacade";
import type ResponseLike from "#ResponseLike";
import session from "#session/index";
import verbs from "#verbs";
import type API from "#wasm/API";
import decodeJson from "#wasm/decode-json";
import decodeResponse from "#wasm/decode-response";
import encodeRequest from "#wasm/encode-request";
import encodeSession from "#wasm/encode-session";
import type Exports from "#wasm/Exports";
import type Instantiation from "#wasm/Instantiation";
import type Tagged from "#wasm/Tagged";
import assert from "@rcompat/assert";
import BufferView from "@rcompat/bufferview";
import FileRef from "@rcompat/fs/FileRef";
import { WASI } from "node:wasi";
import decodeWebsocketClose from "./decode-websocket-close.js";
import decodeWebsocketSendMessage from "./decode-websocket-send.js";

type ServerWebSocket = {
  close(code?: number, reason?: string): void;
  send(value: ArrayBufferLike | ArrayBufferView | Blob | string): void;
};

/** The default request and response types, which are likely pointers into a
 * WASM linear memory space. */
type I32 = number;

type Init = {
  filename: string;
  imports?: WebAssembly.Imports;
};

// used by instance
export type { API };

/**
 * Instantiate a WASM module from a file reference and the given web assembly
 * imports.
 *
 * @param ref The file reference to the WASM module.
 * @param imports The imports to pass to the WASM module when instantiating it.
 * @returns The instantiated WASM module, its exports, and the API that Primate
 * exposes to the WASM module.
 */
const instantiate = async <TRequest = I32, TResponse = I32>(args: Init) => {
  const wasmFileRef = new FileRef(args.filename);
  const wasmImports = args.imports ?? {};

  // default payload is set to an empty buffer via setPayloadBuffer
  let payload = new Uint8Array(0) as Uint8Array;
  let received = new Uint8Array(0) as Uint8Array;
  const setPayload = (value: Uint8Array) => {
    payload = value;
  };

  const sockets = new Map<bigint, ServerWebSocket>();

  /**
   * The imports that Primate provides to the WASM module. This follows the
   * Primate WASM ABI convention.
   */
  const primateImports = {
    /**
     * Get the current session and set it as the payload. This method should
     * only be called after a JSON payload has been received via the `send`
     * function.
     */
    getSession() {
      const currentSession = session();
      const encodedSession = encodeSession(currentSession);
      payload = encodedSession;
    },

    /**
     * Create a new session and set it as the current session. This method
     * should only be called after a JSON payload has been received via the
     * `send` function.
     *
     * Once the session has been created, the `payload` should be set to the
     * encoded session, and then `payloadByteLength` and `receive` should be
     * called to send the payload to the WASM module.
     */
    newSession() {
      const data = decodeJson.from(received);
      session().create(data);
      const newSession = session();
      payload = encodeSession(newSession);
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
     * Send the current active payload to the WASM module.
     *
     * @param ptr The pointer to where the payload should be written into the
     * WASM linear memory space.
     * @param length The length of the payload. This must match the actual
     * payload length, otherwise an exception will be thrown.
     */
    receive(ptr: number, length: number) {
      assert(payload.length === length, "Payload length mismatch");

      const wasmBuffer = new Uint8Array(memory.buffer, ptr, length);
      wasmBuffer.set(payload);
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
     * Close a WebSocket.
     */
    websocketClose() {
      const { id } = decodeWebsocketClose(payload);
      assert(sockets.has(id),
        "Invalid socket id. Was the socket already closed?");
      const socket = sockets.get(id)!;
      socket.close();
      sockets.delete(id);
    },

    /**
     * Send a WebSocket message to a given socket by it's id.
     */
    websocketSend() {
      const { id, message } = decodeWebsocketSendMessage(payload);
      assert(sockets.has(id),
        `Invalid socket id ${id}. Was the socket already closed?`);

      const socket = sockets.get(id)!;
      socket.send(message);
    },
  };

  const bytes = await wasmFileRef.arrayBuffer();

  const instantiateDeno = async () => {
    // @ts-expect-error: for deno, need to implement the std lib implementation
    const Context = await import("https://deno.land/std@0.92.0/wasi/snapshot_preview1.ts");
    const context = new Context({
      args: Deno.args,
      env: Deno.env.toObject(),
      preopens: { "./": "./" },
    });

    const instance = await WebAssembly.instantiate(bytes, {
      ...wasmImports,
      "primate": primateImports,
      "wasi_snapshot_preview1": context.exports,
    });
    return instance;
  };

  const defaultInstantiate = async () => {
    const wasiSnapshotPreview1 = new WASI({ version: "preview1" });
    const wasm = await WebAssembly.instantiate(
      bytes,
      {
        ...wasmImports,
        "primate": primateImports,
        "wasi_snapshot_preview1": wasiSnapshotPreview1.wasiImport,
      },
    );
    // start the wasi instance
    wasiSnapshotPreview1.start(wasm.instance);
    return wasm;
  };

  const wasm = typeof Deno !== "undefined"
    ? await instantiateDeno()
    : await defaultInstantiate();

  const exports = wasm.instance.exports as Exports<TRequest, TResponse>;
  const memory = exports.memory;

  const api: API = {};
  const instance = {
    api,
    exports,
    memory,
    setPayload,
    sockets,
  } as Instantiation<TRequest, TResponse>;
  for (const method of verbs) {
    if (method in exports && typeof exports[method] === "function") {
      const methodFunc = (request: Tagged<"Request", TRequest>) =>
        exports[method]!(request) as Tagged<"Response", TResponse>;

      api[method] = async (request: RequestFacade): Promise<ResponseLike> => {
        // payload is now set
        payload = await encodeRequest(request);
        // immediately tell the wasm module to obtain the payload and create a
        // request
        const wasmRequest = exports.newRequest();

        // call the http method and obtain the response, finalizing the request
        const wasmResponse = methodFunc(wasmRequest);
        exports.finalizeRequest(wasmRequest);

        // send the response to the wasm module and decode the response,
        // finalizing the response
        exports.sendResponse(wasmResponse);
        const bufferView = new BufferView(received);
        const response = decodeResponse(bufferView)!;
        exports.finalizeResponse(wasmResponse);

        if (response.type === "web_socket_upgrade") {
          // The callback encloses over the response websocket id provided by
          // the module.
          return response.callback(instance as any);
        }

        if (response.type === "text") {
          return text(response.text, {
            headers: response.headers,
            status: response.status,
          });
        }

        return response.value;
      };
    }
  }

  return instance;
};

export default instantiate;
