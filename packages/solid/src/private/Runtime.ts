import FrontendModule from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import type { Component } from "solid-js";
import { renderToString } from "solid-js/web";

export default class Runtime extends FrontendModule<Component> {
  name = "solid";
  defaultExtensions = [".jsx", ".tsx"];
  client = true;
  layouts = true;
  render: Render<Component> = (view, props) => {
    const heads: string[] = [];
    const push_heads = (sub_heads: string[]) => {
      heads.push(...sub_heads);
    };
    const body = renderToString(() => view({ ...props, push_heads }));

    if (heads.filter(head => head.startsWith("<title")).length > 1) {
      const error = "May only contain one <title> across component hierarchy";
      throw new Error(error);
    }
    const head = heads.join("\n");

    return { body, head };
  };
}
