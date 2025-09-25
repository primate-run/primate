import { RubyVM } from "@ruby/wasm-wasi/dist/vm";
import { WASI } from "wasi";

export default async function(module: WebAssembly.Module, options = {}) {
  const wasip1 = new WASI({
    ...options,
    version: "preview1", returnOnExit: true,
  });
  const { vm, instance } = await RubyVM.instantiateModule({ module, wasip1 });
  return {
    vm,
    wasi: wasip1,
    instance,
  };
};

