import FrontendModule from "@primate/core/frontend/Module";
import type { PolyComponent } from "poly";
import type Render from "@primate/core/frontend/Render";

export default class Runtime extends FrontendModule<PolyComponent> {
  name = "poly";
  defaultExtension = ".poly";
  client = true;
  layouts = true;
  render: Render<PolyComponent> = (component, props) => {
    const { html, head } = component.render(props);
    return { body: html, head };
  };
}
