import type ClientData from "@primate/core/frontend/ClientData";
import type Props from "@primate/core/frontend/Props";
import spa from "@primate/core/frontend/spa";
import { hydrate, mount } from "svelte";

// @ts-expect-error esbuild vfs
import * as components from "svelte:components";
// @ts-expect-error esbuild vfs
import root from "svelte:root";

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
  update: () => undefined,
});

export default class SvelteClient {
  static mount(_component: string, data: ClientData<Data>) {
    const _root = (data.ssr ? hydrate : mount)(root, {
      target: document.body,
      props: {
        p: make_props(data),
      },
    });
    data.spa && window.addEventListener("DOMContentLoaded", () =>
      spa<Data>((_data, update) => {
        _root.p = { ...make_props(_data), update };
      }));
  }
}
