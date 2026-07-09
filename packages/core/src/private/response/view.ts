import type ViewOptions from "#client/ViewOptions";
import E from "#errors";
import type ResponseFunction from "#response/ResponseFunction";
import fs from "@rcompat/fs";
import type { Dict } from "@rcompat/type";

const extensions = ["extension", "fullExtension"] as const;

const backmap: Dict<string> = {
  "component.ts": "angular",
  eta: "eta",
  hbs: "handlebars",
  html: "html",
  htmx: "htmx",
  marko: "marko",
  md: "markdown",
  solid: "solid",
  svelte: "svelte",
  voby: "voby",
  vue: "vue",
  webc: "webc",
  tsx: "react",
  jsx: "react",
};

function view(
  component: abstract new (...args: any[]) => any,
  props?: Dict,
  options?: ViewOptions,
): ResponseFunction<Dict>;
function view<Props>(
  component: unknown,
  props: Props,
  options?: ViewOptions,
): ResponseFunction<Props>;
function view(
  component: unknown,
  props?: Dict,
  options?: ViewOptions,
): ResponseFunction<Dict>;
function view<Props extends Dict>(
  name: string,
  props?: Props,
  options?: ViewOptions,
): ResponseFunction<Props>;
function view(name: any, props?: Dict, options?: ViewOptions): ResponseFunction<Dict> {
  const view_name: string = name;
  return async (app, transfer, request) => {
    const found_view = extensions
      .map(extension => app.frontends[fs.ref(view_name)[extension]])
      .find(extension => extension !== undefined)
      ?.(view_name, props, options)(app, transfer, request);
    if (found_view !== undefined) return found_view;
    const extension = fs.ref(view_name).fullExtension.slice(1);
    throw E.frontend_missing(view_name, backmap[extension]);
  };
}

export default view;
