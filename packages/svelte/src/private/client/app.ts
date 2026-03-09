import type Data from "#client/Data";
import type Payload from "#client/Payload";
import type { RootProps } from "#client/root";
import root from "#client/root";
import client from "@primate/core/client";
import RootView from "svelte:root";

type MountedRoot = {
  p: RootProps;
};

export default class SvelteApp {
  static mount(_view: string, data: Data) {
    const Root = root[data.ssr ? "ssr" : "csr"](RootView, {
      props: { p: root.toProps(data) },
      target: document.body,
    }) as MountedRoot;
    if (data.spa) {
      const start = () =>
        client.boot<Payload>((_data, update) => {
          Root.p = { ...root.toProps(_data), update };
        });

      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", start, { once: true });
      } else {
        start();
      }
    }
  }
}
