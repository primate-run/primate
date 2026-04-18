import "#client/AAA";
import type Data from "#client/Data";
import type Payload from "#client/Payload";
import type { RootProps } from "#client/root";
import root from "#client/root";
import INITIAL_PROPS from "#INITIAL_PROPS";
import type { ApplicationRef, ComponentRef } from "@angular/core";
import { enableProdMode } from "@angular/core";
import {
  bootstrapApplication,
  provideClientHydration,
} from "@angular/platform-browser";
import client from "@primate/core/client";
import RootView from "angular:root";

type RootInstance = {
  p: RootProps;
};

export default class AngularApp {
  static #app: ApplicationRef;
  static #root: ComponentRef<RootInstance>;

  static async mount(_view: string, data: Data) {
    const interactive = !data.ssr || data.csr;

    if (!interactive) return;

    if (data.mode === "production") enableProdMode();

    const providers = [];
    if (data.ssr) providers.push(provideClientHydration());
    else document.body.appendChild(document.createElement("app-root"));

    const props = root.toProps(data);

    try {
      this.#app = await bootstrapApplication(RootView, {
        providers: [
          ...providers,
          {
            provide: INITIAL_PROPS,
            useValue: props,
          },
        ],
      });

      this.#root = this.#app.components[0] as ComponentRef<RootInstance>;
      this.#root.instance.p = props;
      this.#app.tick();

      if (data.csr) {
        const start = () =>
          client.boot<Payload>((next, update) => {
            this.#root.instance.p = root.toProps(next, update);
            this.#app.tick();
            update?.();
          });

        if (document.readyState === "loading") {
          window.addEventListener("DOMContentLoaded", start, { once: true });
        } else {
          start();
        }
      }
    } catch (error) {
      console.error("Failed to bootstrap Angular application:", error);
    }
  }
}
