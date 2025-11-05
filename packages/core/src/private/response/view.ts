import fail from "#fail";
import type ViewOptions from "#frontend/ViewOptions";
import FileRef from "@rcompat/fs/FileRef";
import type Dict from "@rcompat/type/Dict";
import type ResponseFunction from "./ResponseFunction.js";

const extensions = ["extension", "fullExtension"] as const;

const backmap: Dict<string> = {
  "component.ts": "angular",
  eta: "eta",
  hbs: "handlebars",
  html: "html",
  htmx: "htmx",
  marko: "marko",
  md: "markdown",
  poly: "poly",
  solid: "solid",
  svelte: "svelte",
  voby: "voby",
  vue: "vue",
  webc: "webc",
  tsx: "react",
  jsx: "react",
};

function no_frontend(view: string) {
  const extension = new FileRef(view).fullExtension.slice(1);
  const hasPkg = extension in backmap;
  const error = "No frontend for {0}";
  const fix = hasPkg ? ", did you configure {1}?" : "";
  const pkgname = hasPkg ? `@primate/${backmap[extension]}` : "";

  return fail(`${error}${fix}`, view, pkgname);
}

function view<Props>(
  component: (props: Props) => any,
  props: Props,
  options?: ViewOptions,
): ResponseFunction;
function view(
  component: () => any,
  props?: Dict,
  options?: ViewOptions,
): ResponseFunction;
function view(
  name: string,
  props?: Dict,
  options?: ViewOptions,
): ResponseFunction;
/**
 * Render a view component using a frontend for the given filename extension
 * @param view path to view
 * @param props props for view
 * @param options rendering options
 * @return Response rendering function
 */
function view(name: any, props?: Dict, options?: ViewOptions): ResponseFunction {
  const _name: string = name;
  return async (app, transfer, request) => {
    const found_view = extensions
      .map(extension => app.frontends[new FileRef(_name)[extension]])
      .find(extension => extension !== undefined)
      ?.(_name, props, options)(app, transfer, request);
    if (found_view !== undefined) return found_view;
    throw no_frontend(_name);
  };
}

export default view;
