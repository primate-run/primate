import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import type Dict from "@rcompat/type/Dict";
import { createSSRApp } from "vue";
import root from "vue:root";
import * as views from "vue:views";

type Data = ClientData<{
  views: string[];
  props: Dict[];
}>;

export default class VueClient {
  static mount(_view: string, data: ClientData<Data>) {
    const resolve = (names: string[]) =>
      names.map((n) => (views as Record<string, any>)[n]);

    let app = createSSRApp(root, {
      p: {
        views: resolve(data.views),
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
              views: resolve(next.views),
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
