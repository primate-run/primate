import BufferView from "@rcompat/bufferview";

type BufferViewSource = ConstructorParameters<typeof BufferView>;

const decodeWebsocketClose = (...bufferSource: BufferViewSource) => {
  const bufferView = new BufferView(...bufferSource);
  const id = bufferView.readU64();
  return { id };
};

export default decodeWebsocketClose;
