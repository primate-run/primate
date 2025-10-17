import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import type Dict from "@rcompat/type/Dict";
import root from "poly:root";
import * as views from "poly:views";

type Data = ClientData<{
  views: string[];
  props: Dict[];
}>;

const make_props = (data: ClientData<Data>) => ({
  views: data.views.map(name => views[name]),
  props: data.props,
  request: {
    ...data.request,
    url: new URL(location.href),
  },
});

export default class PolyClient {
  static mount(_view: string, data: ClientData<Data>) {
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
