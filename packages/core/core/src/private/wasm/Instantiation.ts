import type API from "#wasm/API";
import type Exports from "#wasm/Exports";
import type I32 from "#wasm/I32";

type Instantiation<TRequest = I32, TResponse = I32> = {
  api: API;
  exports: Exports<TRequest, TResponse>;
  memory: WebAssembly.Memory;
  setPayload(value: Uint8Array): void;
  sockets: Map<bigint, any>;
};

export type { Instantiation as default };
