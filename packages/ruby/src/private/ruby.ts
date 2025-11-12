import FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/fs/project/root";

const ruby_path = (await root())
  .join("node_modules/@ruby/head-wasm-wasi/dist/ruby+stdlib.wasm");
const ruby_wasm = await FileRef.arrayBuffer(ruby_path) as ArrayBuffer;

export default await WebAssembly.compile(ruby_wasm);
