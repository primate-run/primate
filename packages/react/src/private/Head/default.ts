import HeadContext from "#context/head";
import type Props from "@primate/core/frontend/Props";
import React from "react";

type Child = {
  type: string;
  props: Props;
};

const to_array = (maybe: Child[]) => Array.isArray(maybe) ? maybe : [maybe];

const data_attribute = "data-rh";
const data_ssr = "ssr";
const allowed = ["title", "meta", "style", "meta", "link", "script", "base"];

const make_tag = ({ type, props }: Child, id: string) => {
  const attributes = Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .concat(`${data_attribute}="${id}"`)
    .join(" ");

  return `<${type} ${attributes}/>`;
};

const render = (maybe_children: Child[], id: string) => {
  const children = to_array(maybe_children);
  const all_good = children.every(({ type }) => allowed.includes(type));
  if (!all_good) {
    const bad = `<${children.find(({ type }) => !allowed.includes(type))!.type}>`;
    const alloweds = `${allowed.map(tag => `<${tag}>`).join(", ")}`;
    const error = `Head may only contain ${alloweds}, found ${bad}`;
    throw new Error(error);
  }

  const titles = children.filter(({ type }) => type === "title");
  const others = children.filter(({ type }) => type !== "title");

  return [
    ...titles.map(title => `<title>${title.props.children}</title>`),
    ...others.map(other => make_tag(other, id)),
  ];
};

const clear = (data_value: string) => {
  const selector = `[${data_attribute}="${data_value}"]`;
  globalThis.document.querySelectorAll(selector).forEach(element => {
    element.remove();
  });
};

const Head = class Head extends React.Component<{ children: Child[] }> {
  declare context: React.ContextType<React.Context<any>>;

  id?: string;
  // clearing after SSR and before root hydration
  static clear(data_value = data_ssr) {
    clear(data_value);
  }

  render() {
    this.context(render(this.props.children, data_ssr));

    // no return, nothing rendered
    return undefined as React.ReactNode;
  }
};

Head.contextType = HeadContext;

export default Head;
