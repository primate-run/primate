import type Render from "@primate/core/frontend/Render";
import ServeModule from "@primate/core/frontend/ServeModule";
import type { Renderable } from "marko/src/runtime/html/Template.js";

export default class ServeMarko extends ServeModule<Renderable> {
  name = "marko";
  root = false;
  render: Render<Renderable> = (component, props) =>
    ({ body: component.renderToString(props) });
}
