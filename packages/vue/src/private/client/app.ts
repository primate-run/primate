
import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import type { Dict } from "@rcompat/type";
import { createApp, createSSRApp } from "vue";
import root from "vue:root";
import * as views from "vue:views";

type Data = ClientData<{
  views: string[];
  props: Dict[];
}>;

function resolve(names: string[]) {
  return names.map(n => (views as Dict<any>)[n]);
}

const make_app = (ssr: boolean, data: ClientData<Data>, update?: () => void) => {
  const create = ssr ? createSSRApp : createApp;
  return create(root, {
    p: {
      views: resolve(data.views),
      props: data.props,
      request: data.request,
      update,
    },
  });
};

export default class VueApp {
  static mount(_view: string, data: ClientData<Data>) {
    let app = make_app(data.ssr, data);
    app.mount("#app");

    if (data.spa) {
      window.addEventListener("DOMContentLoaded", () =>
        spa<Data>((next, update) => {
          app.unmount();
          app = make_app(false, next, update);
          app.mount("#app");
        }),
      );
    }
  }
}
