import type Data from "#client/Data";
import type Payload from "#client/Payload";
import root from "#client/root";
import client from "@primate/core/client";

export default class VueApp {
  static mount(_view: string, data: Data) {
    const interactive = !data.ssr || data.csr;

    if (!interactive) return;

    let app = root[data.ssr ? "ssr" : "csr"](root.toProps(data));
    app.mount("#app");

    if (data.csr) {
      const start = () =>
        client.boot<Payload>((next, update) => {
          app.unmount();
          app = root.csr(root.toProps(next, update));
          app.mount("#app");
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
