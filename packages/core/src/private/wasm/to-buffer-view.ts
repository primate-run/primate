interface BufferViewSource {
  byteLength: number;
  byteOffset: number;
  buffer: ArrayBuffer;
}

type BufferView = {
  buffer: Uint8Array;
  view: DataView;
  byteLength: number;
}

const toBufferView = (source: BufferViewSource): BufferView => {
  const buffer = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  return { buffer, view, byteLength: source.byteLength };
};

export default toBufferView;