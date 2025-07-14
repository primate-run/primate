import AppError from "#AppError";
import type Frontend from "#frontend/Frontend";
import FileRef from "@rcompat/fs/FileRef";
import type PartialDictionary from "@rcompat/type/PartialDictionary";

const extensions = ["extension", "fullExtension"] as const;

const backmap: PartialDictionary<string> = {
  "component.ts": "angular",
  eta: "eta",
  hbs: "handlebars",
  html: "html",
  htmx: "htmx",
  md: "markdown",
  marko: "marko",
  poly: "poly",
  solid: "solid",
  svelte: "svelte",
  voby: "voby",
  vue: "vue",
  webc: "webc",
};

function no_handler(component: string) {
  const pkg = backmap[new FileRef(component).fullExtension.slice(1)];
  const has_pkg = pkg !== undefined;
  const error = "No handler for {0}";
  const fix = has_pkg ? "" : ", did you configure {1}?";
  const pkgname = has_pkg ? "" : `@primate/${pkg}`;
  throw new AppError(`${error}${fix}`, component, pkgname);
}

/**
 * Render a component using handler for the given filename extension
 * @param component path to component
 * @param props props for component
 * @param options rendering options
 * @return Response rendering function
 */
export default ((component, props, options) =>
  (app, transfer, request) => extensions
    .map(extension => app.frontends[new FileRef(component)[extension]])
    .find(extension => extension !== undefined)
    ?.(component, props, options)(app, transfer, request)
    ?? no_handler(component)
) as Frontend;
