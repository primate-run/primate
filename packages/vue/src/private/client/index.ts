import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import type Dict from "@rcompat/type/Dict";
import { createSSRApp } from "vue";
import * as components from "vue:components";
import root from "vue:root";

type Data = ClientData<{
  components: string[];
  props: Dict[];
}>;

export default class VueClient {
  static mount(_component: string, data: ClientData<Data>) {
    const resolve = (names: string[]) =>
      names.map((n) => (components as Record<string, any>)[n]);

    let app = createSSRApp(root, {
      p: {
        components: resolve(data.components),
        props: data.props,
        request: data.request,
        update: undefined,
      },
    });
    app.mount("#app");

    if (data.spa) {
      window.addEventListener("DOMContentLoaded", () =>
        spa<Data>((next, update) => {
          app.unmount();
          app = createSSRApp(root, {
            p: {
              components: resolve(next.components),
              props: next.props,
              request: next.request,
              update,
            },
          });
          app.mount("#app");
          update?.();
        }),
      );
    }
  }
}
