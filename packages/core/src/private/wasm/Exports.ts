import type Verb from "#request/Verb";
import type I32 from "#wasm/I32";
import type Tagged from "#wasm/Tagged";

/** The HTTP Methods that are potentially exported by the WASM module if they
 * are following the Primate WASM ABI convention. */
type ExportedMethods<TRequest = I32, TResponse = I32> = {
  [Method in Verb]?: (request: Tagged<"Request", TRequest>) =>
    Tagged<"Response", TResponse>;
};

/** These functions should be exported by a WASM module to be compatible with
 * Primate. This follows the Primate WASM ABI convention. */
type Exports<TRequest = I32, TResponse = I32> = {
  finalizeRequest(value: Tagged<"Request", TRequest>): void;
  finalizeResponse(value: Tagged<"Response", TResponse>): void;
  getStoreValueDone(): void;
  memory: WebAssembly.Memory;
  newRequest(): Tagged<"Request", TRequest>;
  sendResponse(response: Tagged<"Response", TResponse>): void;
  websocketClose(): void;
  websocketMessage(): void;
  websocketOpen(): void;
} & ExportedMethods<TRequest, TResponse>;

export type { Exports as default };
