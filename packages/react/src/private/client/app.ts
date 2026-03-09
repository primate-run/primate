import type Data from "#client/Data";
import type Payload from "#client/Payload";
import root from "#client/root";
import client from "@primate/core/client";
import ReactHead from "@primate/react/Head";
import { createElement } from "react";
import RootView from "react:root";

const { body } = globalThis.window.document;
ReactHead.clear();

export default class ReactApp {
  static mount(_view: string, data: Data) {
    const Root = root[data.ssr ? "ssr" : "csr"](
      body,
      createElement(RootView, root.toProps(data)),
    );

    if (data.spa) {
      const start = () =>
        client.boot<Payload>((_data, update) => {
          Root.render(createElement(RootView, root.toProps(_data)));
          update?.();
        });

      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", start, { once: true });
      } else {
        start();
      }
    }
  }
}
