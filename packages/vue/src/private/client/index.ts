import type Dict from "@rcompat/type/Dict";
import { createSSRApp } from "vue";
// @ts-expect-error esbuild vfs
import * as components from "vue:components";
// @ts-expect-error esbuild vfs
import root from "vue:root";

export default class Vue {
  static mount(component: string, props: Dict) {
    const rendered = root(components[component], props);
    const app = createSSRApp(rendered);
    app.mount("#app");
  }
}
