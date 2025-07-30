import type App from "@primate/core/App";
import Module from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import type Next from "@primate/core/Next";
import type FileRef from "@rcompat/fs/FileRef";

export default class Runtime extends Module {
  #components?: FileRef;
  name = "webc";
  defaultExtension = ".webc";
  layouts = false;
  client = true;

  render: Render = (_component, _props) => {
    return { body: "", head: "" };
  };

  get components() {
    return this.#components;
  }

  init<T extends App>(app: T, next: Next<T>) {
    this.#components = app.path.components;

    return super.init(app, next);
  }
}
