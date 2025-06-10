import FileRef from "@rcompat/fs/FileRef";
import * as wasi from "node:wasi";


const wasiSnapshotPreview1 = new wasi.WASI({
  version: "preview1",
  env: process.env,
  args: process.argv,
});
const wasmPath = "./test.wasm";

const wasm = await WebAssembly.instantiate(
  typeof Bun === "object"
    ? await Bun.file(wasmPath).arrayBuffer()
    : await FileRef.arrayBuffer(wasmPath),
    {
      "wasi_snapshot_preview1": wasiSnapshotPreview1.wasiImport
    }
);

wasiSnapshotPreview1.start(wasm.instance);

for (const [name, _] of Object.entries(wasm.instance.exports)) {
  console.log(name);
}

const result = wasm.instance.exports.get();
const ref = Buffer.from(wasm.instance.exports.memory.buffer, result);
console.log(ref);
