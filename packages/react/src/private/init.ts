import type { Init } from "@primate/core/frontend";
import type { Dict } from "@rcompat/type";
import { createElement, type FunctionComponent } from "react";
import { renderToString } from "react-dom/server";

const module: Init<FunctionComponent<Dict>> = {
  name: "react",
  extensions: [".jsx", ".tsx"],
  layouts: true,
  client: true,
  render(view, props) {
    const heads: string[] = [];
    const push_heads = (sub_heads: string[]) => {
      heads.push(...sub_heads);
    };
    const body = renderToString(createElement(view,
      { ...props, push_heads }));

    if (heads.filter(head => head.startsWith("<title")).length > 1) {
      const error = "May only contain one <title> across component hierarchy";
      throw new Error(error);
    }
    const head = heads.join("\n");

    return { body, head };
  },
};

export default module;
