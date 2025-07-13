import type ClientData from "@primate/core/frontend/ClientData";
import type Props from "@primate/core/frontend/Props";
import spa from "@primate/core/frontend/spa";

// @ts-expect-error esbuild vfs
import * as components from "poly:components";
// @ts-expect-error esbuild vfs
import root from "poly:root";

type Data = ClientData<{
  components: string[];
  props: Props[];
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
      target: document.body,
      hydrate: data.ssr ? "true" : "false",
      props: make_props(data),
    });
    if (data.spa) {
      window.addEventListener("DOMContentLoaded", _ => spa<Data>((_data, update) => {
        _root.$set({ ...make_props(_data), update });
      }));
    }
  }
}
