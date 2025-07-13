import client from "#client/index";
import type ClientRoot from "@primate/core/frontend/ClientRoot";
import type Render from "@primate/core/frontend/Render";
import ServeModule from "@primate/core/frontend/ServeModule";
import { createElement, type FunctionComponent} from "react";
import { renderToString } from "react-dom/server";
import type Props from "@primate/core/frontend/Props";

type Component = FunctionComponent<Props>;

export default class ServeReact extends ServeModule<Component, ClientRoot> {
  name = "react";
  root = true;
  client = client;
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
