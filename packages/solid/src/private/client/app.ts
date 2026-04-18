import type Data from "#client/Data";
import type Payload from "#client/Payload";
import root from "#client/root";
import client from "@primate/core/client";
import SolidHead from "@primate/solid/Head";
import Root from "solid:root";

declare global {
  interface Window {
    _$HY: {
      completed: WeakSet<object>;
      events: unknown[];
      r: Record<string, unknown>;
    };
  }
}

window._$HY = { completed: new WeakSet(), events: [], r: {} };

const { body } = globalThis.window.document;
SolidHead.clear();

export default class SolidApp {
  static mount(_view: string, data: Data) {
    const interactive = !data.ssr || data.csr;

    if (!interactive) return;

    const mount = () => Root(root.toProps(data));

    let dispose = root[data.ssr ? "ssr" : "csr"](mount, body);

    if (data.csr) {
      const start = () =>
        client.boot<Payload>((_data, update) => {
          dispose();
          dispose = root.csr(() => Root(root.toProps(_data, update)), body);
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
