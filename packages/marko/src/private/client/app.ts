import type Data from "#client/Data";
import type Payload from "#client/Payload";
import render_runtime from "#client/render";
import root from "#client/root";
import client from "@primate/core/client";
import type { Dict } from "@rcompat/type";
import RootView from "marko:root";

type Instance = {
  update?: (input: Dict) => void;
  destroy?: () => void;
};

export default class MarkoApp {
  static mount(_: string, data: Data) {
    const interactive = !data.ssr || data.csr;

    if (!interactive) return;

    let instance: Instance | undefined;
    let current = data;

    const key = (next: Data) => `${next.views.join("\0")}\0${next.request.url}`;
    const render = (next: Data, remount: boolean = false) => {
      current = next;

      const props = root.toProps(next);

      runtime.run(key(next), () => {
        if (!remount && instance !== undefined) {
          instance.update?.(props);
          return;
        }

        instance?.destroy?.();
        document.body.replaceChildren();
        instance = (RootView as any).mount(props, document.body);
      });
    };

    const runtime = render_runtime.create(() => {
      render(current, true);
    });

    render(data, true);

    if (data.csr) {
      const start = () =>
        client.boot<Payload>((next, update) => {
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
