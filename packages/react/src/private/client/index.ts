import type ClientData from "@primate/core/frontend/ClientData";
import spa from "@primate/core/frontend/spa";
import ReactHead from "@primate/react/Head";
import type Dict from "@rcompat/type/Dict";
import { createElement, type ReactNode } from "react";
import { createRoot, hydrateRoot, type Container } from "react-dom/client";

// @ts-expect-error esbuild vfs
import * as components from "react:components";
// @ts-expect-error esbuild vfs
import root_component from "react:root";

type Data = ClientData<{
  components: string[];
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

const make_props = (data: ClientData<Data>) => ({
  components: data.components.map(name  => components[name]),
  props: data.props,
  request: {
    ...data.request,
    url: new URL(location.href),
  },
});

export default class React {
  static mount(component: string, data: ClientData<Data>) {
    const root = make_root[data.ssr ? "ssr" : "csr"](body,
      createElement(root_component, make_props(data)));

    if (data.spa) {
      window.addEventListener("DOMContentLoaded", _ => spa<Data>(_data => {
        root.render(createElement(root_component, make_props(_data)));
      }));
    }
  }
}
