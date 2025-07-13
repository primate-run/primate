import type ClientData from "@primate/core/frontend/ClientData";
import type Props from "@primate/core/frontend/Props";
import spa from "@primate/core/frontend/spa";
import SolidHead from "@primate/solid/Head";
import { hydrate, render } from "solid-js/web";
// @ts-expect-error esbuild vfs
import * as components from "solid:components";
// @ts-expect-error esbuild vfs
import root_component from "solid:root";

// @ts-expect-error solid hydration
globalThis._$HY = { events: [], completed: new WeakSet(), r: {} };

const { body } = globalThis.window.document;
SolidHead.clear();

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

export default class Solid {
  static mount(component: string, data: ClientData<Data>) {
    let dispose = hydrate(() => root_component(make_props(data)), body);


    if (data.spa) {
      window.addEventListener("DOMContentLoaded", _ => spa<Data>(_data => {
        dispose();
        dispose = render(() => root_component(make_props(_data)), body);
      }));
    }
  }
}
