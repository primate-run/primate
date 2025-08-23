import FrontendModule from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import type { Renderable } from "marko/src/runtime/html/Template.js";

export default class Runtime extends FrontendModule<Renderable> {
  name = "marko";
  defaultExtensions = [".marko"];
  layouts = false;
  client = false;
  render: Render<Renderable> = (component, props) =>
    ({ body: component.renderToString(props) });
}
