import decodeJson from "#wasm/decode-json";

type BufferViewSource = Parameters<typeof decodeJson.from>[0];

export default (source: BufferViewSource) => decodeJson.from(source);
