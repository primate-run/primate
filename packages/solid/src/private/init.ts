import type { Init } from "@primate/core/frontend";
import type { Component } from "solid-js";
import { renderToString } from "solid-js/web";

const module: Init<Component> = {
  name: "solid",
  extensions: [".jsx", ".tsx"],
  layouts: true,
  client: true,
  render(view, props) {
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
  },
};

export default module;
