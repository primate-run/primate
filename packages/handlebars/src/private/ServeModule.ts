import type Render from "@primate/core/frontend/Render";
import ServeModule from "@primate/core/frontend/ServeModule";
import runtime from "handlebars/runtime.js";

export default class ServeHandlebars extends ServeModule {
  name = "handlebars";
  root = false;
  defaultExtension = ".hbs";
  render: Render = (component, props) =>
    ({ body: (runtime as any).template(component)(props) });
}
