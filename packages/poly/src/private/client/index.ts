import type ClientData from "@primate/core/frontend/ClientData";
import spa from "@primate/core/frontend/spa";
import type Dict from "@rcompat/type/Dict";

// @ts-expect-error esbuild vfs
import * as components from "poly:components";
// @ts-expect-error esbuild vfs
import root from "poly:root";

type Data = ClientData<{
  components: string[];
  props: Dict[];
}>;

const make_props = (data: ClientData<Data>) => ({
  components: data.components.map(name  => components[name]),
  props: data.props,
  request: {
    ...data.request,
    url: new URL(location.href),
  },
});

export default class PolyClient {
  static mount(_component: string, data: ClientData<Data>) {
    const _root = new root({
      hydrate: data.ssr ? "true" : "false",
      props: make_props(data),
      target: document.body,
    });
    if (data.spa) {
      window.addEventListener("DOMContentLoaded", _ => spa<Data>((_data, update) => {
        _root.$set({ ...make_props(_data), update });
      }));
    }
  }
}
