import FrontendModule from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import runtime from "handlebars/runtime.js";

export default class Runtime extends FrontendModule {
  name = "handlebars";
  defaultExtensions = [".hbs"];
  layouts = false;
  client = false;
  render: Render = (component, props) =>
    ({ body: (runtime as any).template(component)(props) });
}
