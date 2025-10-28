import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import ReactHead from "@primate/react/Head";
import type Dict from "@rcompat/type/Dict";
import { createElement, type ReactNode } from "react";
import { createRoot, hydrateRoot, type Container } from "react-dom/client";
import root_view from "react:root";
import * as views from "react:views";

type Data = ClientData<{
  views: string[];
  props: Dict[];
}>;

const { body } = globalThis.window.document;
ReactHead.clear();

const make_root = {
  csr: (dom_node: Container, react_node: ReactNode) => {
    const root = createRoot(dom_node);
    root.render(react_node);
    return root;
  },
  ssr: (dom_node: Element, react_node: ReactNode) =>
    hydrateRoot(dom_node, react_node),
};

function make_props(data: ClientData<Data>) {
  return {
    views: data.views.map(name => views[name]),
    props: data.props,
    request: {
      ...data.request,
      url: new URL(location.href),
    },
  };
}

export default class React {
  static mount(_view: string, data: ClientData<Data>) {
    const root = make_root[data.ssr ? "ssr" : "csr"](body,
      createElement(root_view, make_props(data) as any));

    if (data.spa) {
      window.addEventListener("DOMContentLoaded", _ => spa<Data>(_data => {
        root.render(createElement(root_view, make_props(_data) as any));
      }));
    }
  }
}
