import instantiate from "@primate/core/wasm/instantiate";

const instantiated = await instantiate({
  wasmFile: "__FILE_NAME__",
  imports: {},
});

export default instantiated.api;
