import fs from "@rcompat/fs";

const wasm_path = "node_modules/@ruby/head-wasm-wasi/dist/ruby+stdlib.wasm";
const wasm = (await fs.project.root()).join(wasm_path);

export default await WebAssembly.compile(await fs.arrayBuffer(wasm));
