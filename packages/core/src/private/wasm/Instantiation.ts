import type API from "#wasm/API";
import type Exports from "#wasm/Exports";
import type I32 from "#wasm/I32";

type Instantiation<TRequest = I32, TResponse = I32> = {
  api: API;
  sockets: Map<bigint, any>;
  memory: WebAssembly.Memory;
  exports: Exports<TRequest, TResponse>;
  setPayload(value: Uint8Array): void;
};

export type { Instantiation as default };
