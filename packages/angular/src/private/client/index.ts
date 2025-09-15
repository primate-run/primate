import INITIAL_PROPS from "#INITIAL_PROPS";
import "zone.js";
import "@angular/compiler";
import {
  NgZone,
  provideZoneChangeDetection,
  type ApplicationRef,
  type ComponentRef,
} from "@angular/core";
import {
  bootstrapApplication,
  provideClientHydration,
} from "@angular/platform-browser";
import type ClientData from "@primate/core/client/Data";
import spa from "@primate/core/client/spa";
import type Dict from "@rcompat/type/Dict";
import * as components from "angular:components";
import root from "angular:root";

type Data = ClientData<{
  components: string[];
  props: Dict[];
}>;

const make_props = (data: ClientData<Data>) => ({
  components: data.components.map(name => components[name]),
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
  static #zone: NgZone;

  static async mount(_component: string, data: ClientData<Data>) {
    const providers = [];

    // Add hydration provider for SSR
    if (data.ssr) {
      providers.push(provideClientHydration());
    }

    // Add zone.js change detection
    providers.push(provideZoneChangeDetection({ eventCoalescing: true }));

    // Create the root component props
    const props = make_props(data);

    // Bootstrap the application
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

    this.#zone = this.#root.injector.get(NgZone);
  }

  static #spa() {
    window.addEventListener("DOMContentLoaded", () => {
      spa<Data>((next, update) => {
        const props = { ...make_props(next), update };
        this.#zone.run(() => {
          this.#root.instance.p = props;
          this.#app.tick();
        });
        update?.();
      });
    });
  }
}
