import BufferView from "@rcompat/bufferview";
import decodeString from "./decode-string.js";

const decodeJson = (view: BufferView) => {
  const str = decodeString(view);
  return JSON.parse(str);
};

decodeJson.from = (...args: ConstructorParameters<typeof BufferView>) => {
  const bufferView = new BufferView(...args);
  return decodeJson(bufferView);
}

export default decodeJson;