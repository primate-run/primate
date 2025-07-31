import "@angular/compiler";
import {
  bootstrapApplication,
  provideClientHydration,
} from "@angular/platform-browser";
import type Dict from "@rcompat/type/Dict";
import "zone.js";
// @ts-expect-error esbuild vfs
import * as components from "angular:components";
// @ts-expect-error esbuild vfs
import root from "angular:root";

const config = { providers: [provideClientHydration()] };

export default class Angular {
  static mount(component: string, props: Dict) {
    const rendered = root(components[component], props);

    bootstrapApplication(rendered, config).catch(error => console.error(error));
  }
}
