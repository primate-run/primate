import BufferView from "@rcompat/bufferview";

type BufferViewSource = ConstructorParameters<typeof BufferView>;

const decodeWebsocketClose = (...bufferSource: BufferViewSource) => {
  const bufferView = new BufferView(...bufferSource);
  const offset = { ptr: 0 };
  const id = bufferView.readU64();
  return { id };
};

export default decodeWebsocketClose;
