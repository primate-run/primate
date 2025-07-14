import Module from "@primate/core/frontend/Module";
import type Props from "@primate/core/frontend/Props";
import type Render from "@primate/core/frontend/Render";
import { createElement, type FunctionComponent } from "react";
import { renderToString } from "react-dom/server";

type Component = FunctionComponent<Props>;

export default class Runtime extends Module<Component> {
  name = "react";
  defaultExtension = ".jsx";
  client = true;
  layouts = true;
  render: Render<Component> = (component, props) => {
    const heads: string[] = [];
    const push_heads = (sub_heads: string[]) => {
      heads.push(...sub_heads);
    };
    const body = renderToString(createElement(component,
      { ...props, push_heads }));

    if (heads.filter(head => head.startsWith("<title")).length > 1) {
      const error = "May only contain one <title> across component hierarchy";
      throw new Error(error);
    }
    const head = heads.join("\n");

    return { body, head };
  };
}
