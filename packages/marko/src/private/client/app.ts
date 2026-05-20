
import root from "#client/root";
import client from "@primate/core/client";
import RootView from "marko:root";

type Instance = {
  update?: (input: Record<string, unknown>) => void;
  destroy?: () => void;
};

export default class MarkoApp {
  static mount(_: string, data: any) {
    const interactive = !data.ssr || data.csr;

    if (!interactive) return;

    let instance: Instance | undefined;

    const render = (next: any) => {
      const props = root.toProps(next);

      if (instance !== undefined) {
        instance.update?.(props);
        return;
      }

      document.body.replaceChildren();
      instance = (RootView as any).mount(props, document.body);
    };

    if (!data.ssr) {
      render(data);
    }

    if (data.csr) {
      const start = () =>
        client.boot((next, update) => {
          render(next);
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
