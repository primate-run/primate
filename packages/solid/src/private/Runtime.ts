import Module from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import type { Component } from "solid-js";
import { renderToString } from "solid-js/web";

export default class Runtime extends Module<Component> {
  name = "solid";
  defaultExtension = ".jsx";
  client = true;
  layouts = true;
  render: Render<Component> = (component, props) => {
    const heads: string[] = [];
    const push_heads = (sub_heads: string[]) => {
      heads.push(...sub_heads);
    };
    const body = renderToString(() => component({ ...props, push_heads }));

    if (heads.filter(head => head.startsWith("<title")).length > 1) {
      const error = "May only contain one <title> across component hierarchy";
      throw new Error(error);
    }
    const head = heads.join("\n");

    return { body, head };
  };
}
