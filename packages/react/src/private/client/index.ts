import type ClientData from "@primate/core/frontend/ClientData";
import type Props from "@primate/core/frontend/Props";
import spa from "@primate/core/frontend/spa";
import { hydrateRoot, createRoot, type Container } from "react-dom/client";
import { createElement, type ReactNode } from "react";
import ReactHead from "@primate/react/Head";

// @ts-expect-error esbuild vfs
import * as components from "react:components";
// @ts-expect-error esbuild vfs
import root_component from "react:root";

type Data = ClientData<{
  components: string[];
  props: Props[];
}>;

const { body } = globalThis.window.document;
ReactHead.clear();

const make_root = {
  ssr: (dom_node: Element, react_node: ReactNode) =>
    hydrateRoot(dom_node, react_node),
  csr: (dom_node: Container, react_node: ReactNode) => {
    const root = createRoot(dom_node);
    root.render(react_node);
    return root;
  },
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
