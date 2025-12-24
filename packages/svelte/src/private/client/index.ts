import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import type { Dict } from "@rcompat/type";
import { hydrate, mount } from "svelte";
import root from "svelte:root";
import * as views from "svelte:views";

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
  update: () => undefined,
});

export default class SvelteClient {
  static mount(_view: string, data: ClientData<Data>) {
    const _root: Dict = (data.ssr ? hydrate : mount)(root, {
      props: {
        p: make_props(data),
      },
      target: document.body,
    });
    data.spa && window.addEventListener("DOMContentLoaded", () =>
      spa<Data>((_data, update) => {
        _root.p = { ...make_props(_data), update };
      }));
  }
}
