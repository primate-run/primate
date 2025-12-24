import type DatabaseStore from "#database/Store";
import type RequestFacade from "#request/RequestFacade";
import verbs from "#request/verbs";
import type ResponseLike from "#response/ResponseLike";
import text from "#response/text";
import session from "#session/index";
import type API from "#wasm/API";
import decodeJson from "#wasm/decode-json";
import decodeResponse from "#wasm/decode-response";
import decodeString from "#wasm/decode-string";
import decodeWebsocketClose from "#wasm/decode-websocket-close";
import decodeWebsocketSendMessage from "#wasm/decode-websocket-send";
import encodeRequest from "#wasm/encode-request";
import encodeSession from "#wasm/encode-session";
import encodeString from "#wasm/encode-string";
import type Exports from "#wasm/Exports";
import type I32 from "#wasm/I32";
import type Instantiation from "#wasm/Instantiation";
import type Tagged from "#wasm/Tagged";
import assert from "@rcompat/assert";
import BufferView from "@rcompat/bufferview";
import FileRef from "@rcompat/fs/FileRef";
import utf8 from "@rcompat/string/utf8";
import type { MaybePromise } from "@rcompat/type";
import { WASI } from "node:wasi";
import type { StoreSchema } from "pema";

type ServerWebSocket = {
  close(code?: number, reason?: string): void;
  send(value: ArrayBufferLike | ArrayBufferView | Blob | string): void;
};

type Init = {
  filename: string;
  imports?: WebAssembly.Imports;
  stores: Record<string, DatabaseStore<StoreSchema>>;
};

// used by instance
export type { API };

export type AnyWasmValue = number | bigint | Tagged<"Request", number>;
export type AnyWasmReturnValue = MaybePromise<AnyWasmValue | undefined | void>;
export type AnyWasmFunction<
  Args extends readonly AnyWasmValue[],
  R extends AnyWasmReturnValue,
> = (...args: Args) => R;

declare global {
  interface WebAssemblyExtensions {
    promising: undefined | (<Args extends readonly AnyWasmValue[], R extends AnyWasmReturnValue>(fn: AnyWasmFunction<Args, R>) => AnyWasmFunction<Args, R>);
    Suspending: {
      new <T>(fn: T): { fn: T };
    } | undefined;
  }
}

const WA = WebAssembly as typeof WebAssembly & WebAssemblyExtensions;

export const wrapPromising = <Args extends readonly AnyWasmValue[], R extends AnyWasmReturnValue>(fn: AnyWasmFunction<Args, R>): AnyWasmFunction<Args, R> =>
  typeof WA.promising === "function"
    ? WA.promising(fn)
    : fn;

export const wrapSuspending = <Args extends readonly AnyWasmValue[], R extends AnyWasmReturnValue>(fn: AnyWasmFunction<Args, R>, alt: AnyWasmFunction<Args, R>): WebAssembly.ImportValue =>
  typeof WA.Suspending === "function"
    ? new WA.Suspending(fn) as unknown as WebAssembly.ImportValue
    : alt;

const STORE_OPERATION_SUCCESS = 0;
const STORE_NOT_FOUND_ERROR = 1;
const STORE_RECORD_NOT_FOUND_ERROR = 2;
const STORE_UNKNOWN_ERROR_OCCURRED = 3;
const STORE_SCHEMA_INVALID_RECORD_ERROR = 4;
const STORE_OPERATION_NOT_SUPPORTED = 5;

type STORE_OPERATION_RESULT =
  | typeof STORE_OPERATION_SUCCESS
  | typeof STORE_NOT_FOUND_ERROR
  | typeof STORE_RECORD_NOT_FOUND_ERROR
  | typeof STORE_UNKNOWN_ERROR_OCCURRED
  | typeof STORE_SCHEMA_INVALID_RECORD_ERROR
  | typeof STORE_OPERATION_NOT_SUPPORTED
  ;

/**
 * Instantiate a WASM module from a file reference and the given web assembly
 * imports.
 *
 * @param ref The file reference to the WASM module.
 * @param imports The imports to pass to the WASM module when instantiating it.
 * @returns The instantiated WASM module, its exports, and the API that Primate
 * exposes to the WASM module.
 */
const instantiate = async (args: Init) => {
  type TRequest = I32;
  type TResponse = I32;
  type WasmRequest = Tagged<"Request", TRequest>;
  type WasmResponse = Tagged<"Response", TResponse>;
  type StoreID = Tagged<"StoreID", I32>;

  type MethodFunc = (request: WasmRequest) => MaybePromise<WasmResponse>;

  const wasmFileRef = new FileRef(args.filename);
  const wasmImports = args.imports ?? {};
  const storesByName = args.stores;
  const storeIdsByName = new Map(Object.keys(storesByName).map((e, i) => [e, i]));
  const stores = new Map<StoreID, DatabaseStore<StoreSchema>>(
    Array.from(storeIdsByName.entries())
      .map(([name, id]) => [id as StoreID, storesByName[name]]),
  );

  // default payload is set to an empty buffer via setPayloadBuffer
  let payload = new Uint8Array(0) as Uint8Array;
  let received = new Uint8Array(0) as Uint8Array;
  const setPayload = (value: Uint8Array) => {
    payload = value;
  };

  const sockets = new Map<bigint, ServerWebSocket>();
  /**
   * Get the current session and set it as the payload. This method should
   * only be called after a JSON payload has been received via the `send`
   * function.
   */
  const sessionGet = () => {
    payload = encodeSession(session());
  };

  /**
   * Create a new session and set it as the current session. This method
   * should only be called after a JSON payload has been received via the
   * `send` function.
   *
   * Once the session has been created, the `payload` should be set to the
   * encoded session, and then `payloadByteLength` and `receive` should be
   * called to send the payload to the WASM module.
   */
  const sessionNew = () => {
    const data = decodeJson.from(received);
    session().create(data);
    payload = encodeSession(session());
  };

  /**
   * Check to see if a session exists.
   *
   * @returns {1 | 0}
   */
  const sessionExists = () => {
    return session().exists ? 1 : 0;
  };

  /**
   * Set the current session.
   */
  const sessionSet = () => {
    const data = decodeJson.from(received);
    session().set(data);
  };

  /**
   * Get the length of the current active payload.
   *
   * @returns The length of the payload.
   */
  const payloadByteLength = () => {
    return payload.byteLength;
  };

  /**
   * Send the current active payload to the WASM module.
   *
   * @param ptr The pointer to where the payload should be written into the
   * WASM linear memory space.
   * @param length The length of the payload. This must match the actual
   * payload length, otherwise an exception will be thrown.
   */
  const receive = (ptr: number, length: number) => {
    assert.true(payload.length === length, "Payload length mismatch");

    const wasmBuffer = new Uint8Array(memory.buffer, ptr, length);
    wasmBuffer.set(payload);
  };

  /**
   * Send a payload from the WASM module to Primate.
   *
   * @param ptr The pointer to the payload in the WASM linear memory space.
   * @param length The length of the payload.
   */
  const send = (ptr: number, length: number) => {
    const wasmBuffer = new Uint8Array(memory.buffer, ptr, length);
    const output = new Uint8Array(length);
    output.set(wasmBuffer);
    received = output;
  };

  /**
   * Close a WebSocket.
   */
  const websocketClose = () => {
    const { id } = decodeWebsocketClose(payload);
    assert.true(sockets.has(id),
      "Invalid socket id. Was the socket already closed?");
    const socket = sockets.get(id)!;
    socket.close();
    sockets.delete(id);
  };

  /**
   * Send a WebSocket message to a given socket by it's id.
   */
  const websocketSend = () => {
    const { id, message } = decodeWebsocketSendMessage(payload);
    assert.true(sockets.has(id),
      `Invalid socket id ${id}. Was the socket already closed?`);

    const socket = sockets.get(id)!;
    socket.send(message);
  };

  /** Default Store operation for when Suspending isn't supported. */
  const storeOperationNotSupported = (_id: StoreID) => STORE_OPERATION_NOT_SUPPORTED as STORE_OPERATION_RESULT;

  /**
   * Count the number of records that match the query.
   *
   * @param {StoreID} id - The ID of the store.
   * @returns {STORE_OPERATION_RESULT}
   */
  const storeCount = wrapSuspending<readonly [StoreID], MaybePromise<STORE_OPERATION_RESULT>>(async (id: StoreID) => {
    if (!stores.has(id)) return STORE_NOT_FOUND_ERROR;
    const store = stores.get(id)!;
    const criteria = decodeJson(new BufferView(received))
    const count = await store.count(criteria);
    payload = new Uint8Array(4);
    new DataView(payload.buffer).setUint32(0, count, true);
    return STORE_OPERATION_SUCCESS;
  }, storeOperationNotSupported);

  /**
   * Delete a record by it's id.
   *
   * @param {StoreID} id - The ID of the store.
   * @returns {STORE_OPERATION_RESULT}
   */
  const storeDelete = wrapSuspending<readonly [StoreID], MaybePromise<STORE_OPERATION_RESULT>>(async (id: StoreID) => {
    if (!stores.has(id)) return STORE_NOT_FOUND_ERROR;
    const store = stores.get(id)!;
    try {
      const id = decodeJson(new BufferView(received));
      await store.delete(id);
      return STORE_OPERATION_SUCCESS;
    } catch (ex) {
      return STORE_RECORD_NOT_FOUND_ERROR;
    }
  }, storeOperationNotSupported);


  /**
   * Get a store by it's "import", and return it to wasm.
   *
   * @returns {STORE_OPERATION_RESULT}
   */
  const storeImport = () => {
    const storeName = decodeString(new BufferView(received));
    if (storeIdsByName.has(storeName)) {
      payload = new Uint8Array(4);
      new DataView(payload.buffer).setUint32(0, storeIdsByName.get(storeName)!, true);
      return STORE_OPERATION_SUCCESS;
    }
    return STORE_NOT_FOUND_ERROR;
  };

  /**
   * Find records in a store.
   *
   * @param {StoreID} id - The id of the store.
   * @returns {STORE_OPERATION_RESULT}
   */
  const storeFind = wrapSuspending<readonly [StoreID], MaybePromise<STORE_OPERATION_RESULT>>(async (id: StoreID) => {
    if (!stores.has(id)) return STORE_NOT_FOUND_ERROR;
    const store = stores.get(id)!;
    const query = decodeJson(new BufferView(received));

    try {
      const records = await store.find(query);
      const recordsPayload = JSON.stringify(records);
      payload = new Uint8Array(utf8.size(recordsPayload) + 4);
      encodeString(recordsPayload, new BufferView(payload));
      return STORE_OPERATION_SUCCESS;
    } catch (ex) {
      return STORE_UNKNOWN_ERROR_OCCURRED;
    }
  }, storeOperationNotSupported);

  /**
   * Get a record by it's id.
   *
   * @param {StoreID} id - The id of the store.
   * @returns {STORE_OPERATION_RESULT}
   */
  const storeGet = wrapSuspending<readonly [StoreID], MaybePromise<STORE_OPERATION_RESULT>>(async (id: StoreID) => {
    if (!stores.has(id)) return STORE_NOT_FOUND_ERROR;

    const store = stores.get(id)!;
    const recordId = decodeString(new BufferView(received));
    const record = await store.try(recordId);
    if (record) {
      const recordPayload = JSON.stringify(record);
      payload = new Uint8Array(utf8.size(recordPayload) + 4);
      encodeString(recordPayload, new BufferView(payload));
      return STORE_OPERATION_SUCCESS;
    } else {
      return STORE_RECORD_NOT_FOUND_ERROR;
    }
  }, storeOperationNotSupported);

  /**
   * Check if a record exists based on a record id.
   *
   * @param {StoreID} id - The id of the store.
   * @returns {STORE_OPERATION_RESULT}
   */
  const storeHas = wrapSuspending<readonly [StoreID], MaybePromise<STORE_OPERATION_RESULT>>(async (id: StoreID) => {
    if (!stores.has(id)) return STORE_NOT_FOUND_ERROR;
    const store = stores.get(id)!;
    const recordId = decodeString(new BufferView(received));

    if (await store.has(recordId)) {
      payload = new Uint8Array(4);
      payload[0] = 1;
    } else {
      payload = new Uint8Array(4);
    }
    return STORE_OPERATION_SUCCESS
  }, storeOperationNotSupported);

  /**
   * Insert a record into a store.
   *
   * @param {StoreID} id - The id of the store.
   * @returns {STORE_OPERATION_RESULT}
   */
  const storeInsert = wrapSuspending<readonly [StoreID], MaybePromise<STORE_OPERATION_RESULT>>(async (id: StoreID) => {
    if (!stores.has(id)) return STORE_NOT_FOUND_ERROR;
    const store = stores.get(id)!;
    try {
      const record = decodeJson(new BufferView(received));
      const result = JSON.stringify(await store.insert(record));
      payload = new Uint8Array(utf8.size(result) + 4);
      encodeString(result, new BufferView(payload));
      return STORE_OPERATION_SUCCESS;
    } catch (ex) {
      return STORE_SCHEMA_INVALID_RECORD_ERROR;
    }
  }, storeOperationNotSupported);

  /**
   * Update a record in a store by it's id.
   *
   * @param {StoreID} id - The id of the store.
   * @returns {STORE_OPERATION_RESULT}
   */
  const storeUpdate = wrapSuspending<readonly [StoreID], MaybePromise<STORE_OPERATION_RESULT>>(async (id: StoreID) => {
    if (!stores.has(id)) return STORE_NOT_FOUND_ERROR;
    const store = stores.get(id)!;
    try {
      const view = new BufferView(received);
      const id = decodeString(view);
      const changes = decodeJson(view);
      await store.update(id, changes);
      return STORE_OPERATION_SUCCESS;
    } catch (ex) {
      return STORE_SCHEMA_INVALID_RECORD_ERROR;
    }
  }, storeOperationNotSupported);

  const storeClear = wrapSuspending<readonly [StoreID], MaybePromise<STORE_OPERATION_RESULT>>(async (id: StoreID) => {
    if (!stores.has(id)) return STORE_NOT_FOUND_ERROR;
    const store = stores.get(id)!;
    await store.collection.delete();
    await store.collection.create();
    return STORE_OPERATION_SUCCESS;
  }, storeOperationNotSupported);

  /**
   * The imports that Primate provides to the WASM module. This follows the
   * Primate WASM ABI convention.
   */
  const primateImports = {
    payloadByteLength,
    receive,
    send,
    sessionExists,
    sessionGet,
    sessionNew,
    sessionSet,
    storeClear,
    storeCount,
    storeDelete,
    storeFind,
    storeGet,
    storeHas,
    storeImport,
    storeInsert,
    storeUpdate,
    websocketClose,
    websocketSend,
  };

  const bytes = await wasmFileRef.arrayBuffer();

  const memory = new WebAssembly.Memory({ initial: 64 });

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
      "env": { memory },
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
        "env": { memory },
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

      type ExportedWasmMethodFunc = AnyWasmFunction<readonly [WasmRequest], WasmResponse>
      const methodFunc = wrapPromising(exports[method] as ExportedWasmMethodFunc) as MethodFunc;

      api[method] = async (request: RequestFacade): Promise<ResponseLike> => {
        // payload is now set
        payload = await encodeRequest(request);
        // immediately tell the wasm module to obtain the payload and create a
        // request
        const wasmRequest = exports.newRequest();

        // call the http method and obtain the response, finalizing the request
        const wasmResponse = await methodFunc(wasmRequest);
        exports.finalizeRequest(wasmRequest);

        // send the response to the wasm module and decode the response,
        // finalizing the response
        exports.sendResponse(wasmResponse);
        const bufferView = new BufferView(received);
        const response = decodeResponse(bufferView)!;
        exports.finalizeResponse(wasmResponse);

        if (response.type === "web_socket_upgrade") {
          // the callback encloses over the response websocket id provided by
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
