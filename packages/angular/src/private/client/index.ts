import INITIAL_PROPS from "#INITIAL_PROPS";
import "@angular/compiler";
import {
  enableProdMode,
  type ApplicationRef,
  type ComponentRef,
} from "@angular/core";
import {
  bootstrapApplication,
  provideClientHydration,
} from "@angular/platform-browser";
import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import type Mode from "@primate/core/Mode";
import type Dict from "@rcompat/type/Dict";
import root from "angular:root";
import * as views from "angular:views";

type Data = ClientData<{
  views: string[];
  props: Dict[];
  mode: Mode;
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

export default class AngularClient {
  static #app: ApplicationRef;
  static #root: ComponentRef<any>;

  static async mount(_view: string, data: ClientData<Data>) {
    if (data.mode === "production") enableProdMode();
    const providers = [];

    // add hydration provider for SSR
    if (data.ssr) providers.push(provideClientHydration());
    // in non-SSR mode, the HTML won't contain app-root, inject it
    else document.body.appendChild(document.createElement("app-root"));

    // create the root view props
    const props = make_props(data);

    // bootstrap the application
    try {
      this.#app = await bootstrapApplication(root, {
        providers: [
          ...providers,
          {
            provide: INITIAL_PROPS,
            useValue: props,
          },
        ],
      });

      this.#root = this.#app.components[0];

      // initial props
      if (this.#root.instance) {
        this.#root.instance.p = props;

        // change detection
        this.#app.tick();
      }

      if (data.spa) {
        this.#spa();
      }
    } catch (error) {
      console.error("Failed to bootstrap Angular application:", error);
    }

  }

  static #spa() {
    window.addEventListener("DOMContentLoaded", () => {
      spa<Data>((next, update) => {
        const props = { ...make_props(next), update };
        this.#root.instance.p = props;
        this.#app.tick();
        update?.();
      });
    });
  }
}
