import FrontendModule from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import type { PolyComponent } from "poly";

export default class Runtime extends FrontendModule<PolyComponent> {
  name = "poly";
  defaultExtensions = [".poly", ".svelte"];
  client = true;
  layouts = true;
  render: Render<PolyComponent> = (view, props) => {
    const { head, html } = view.render(props);
    return { body: html, head };
  };
}
