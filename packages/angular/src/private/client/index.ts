import "@angular/compiler";
import "zone.js";
import type Props from "@primate/core/frontend/Props";

import {
  bootstrapApplication,
  provideClientHydration,
} from "@angular/platform-browser";

import {
  enableProdMode,
} from "@angular/core";

import stringify from "@rcompat/record/stringify";
export { stringify };

// @ts-expect-error esbuild vfs
import * as components from "angular:components";
// @ts-expect-error esbuild vfs
import root from "angular:root";

const config = { providers: [provideClientHydration()] };

export default class Angular {
  static mount(component: string, props: Props) {
    const rendered = root(components[component], props);

    bootstrapApplication(rendered, config).catch(error => console.error(error));
  }
}
