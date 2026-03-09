import type { App, Next } from "@primate/core";
import type { Render } from "@primate/core/frontend";
import FrontendModule from "@primate/core/frontend/Module";
import type { FileRef } from "@rcompat/fs";

export default class Runtime extends FrontendModule {
  #views?: FileRef;
  name = "webc";
  defaultExtensions = [".webc"];
  layouts = false;
  client = true;

  render: Render = (_view, _props) => {
    return { body: "", head: "" };
  };

  get views() {
    return this.#views;
  }

  init<T extends App>(app: T, next: Next<T>) {
    this.#views = app.path.views;

    return super.init(app, next);
  }
}
