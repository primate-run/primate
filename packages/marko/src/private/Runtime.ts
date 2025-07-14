import type Render from "@primate/core/frontend/Render";
import Module from "@primate/core/frontend/Module";
import type { Renderable } from "marko/src/runtime/html/Template.js";

export default class Runtime extends Module<Renderable> {
  name = "marko";
  defaultExtension = ".marko";
  layouts = false;
  client = false;
  render: Render<Renderable> = (component, props) =>
    ({ body: component.renderToString(props) });
}
