import runtime from "@rcompat/runtime";

const wasm_path = "node_modules/@ruby/head-wasm-wasi/dist/ruby+stdlib.wasm";
const wasm = await (await runtime.projectRoot()).join(wasm_path).arrayBuffer();

export default await WebAssembly.compile(wasm);
