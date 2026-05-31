import type Data from "#client/Data";
import type Payload from "#client/Payload";
import root from "#client/root";
import type I18NModule from "#I18NModule";
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
    let initial = data.ssr;

    const key = (next: Data) => `${next.views.join("\0")}\0${next.request.url}`;

    const render = (next: Data, remount: boolean = false) => {
      current = next;
      const props = root.toProps(next);

      if (!remount && instance !== undefined) {
        instance.update?.(props);
        return;
      }

      instance?.destroy?.();
      document.body.replaceChildren();
      instance = (RootView as any).mount(props, document.body);
    };

    const invalidate = () => render(current, true);

    const mods: I18NModule[] = (globalThis as any).__primate_i18n__ ?? [];
    for (const mod of mods) {
      mod.invalidate(invalidate);
    }

    if (!data.ssr) {
      render(data, true);
    }

    if (data.csr) {
      const start = () =>
        client.boot<Payload>((next, update) => {
          if (initial && key(next) === key(current)) {
            initial = false;
            current = next;
            update?.();
            return;
          }

          initial = false;
          render(next, instance === undefined);
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
