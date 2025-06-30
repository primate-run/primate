import FileRef from "@rcompat/fs/FileRef";
import instantiate from "@primate/core/wasm/instantiate";

const wasmRef = new FileRef("__FILE_NAME__");

const instantiated = await instantiate<number, number>(wasmRef);

const api = instantiated.api

export { api as default }
