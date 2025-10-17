import fail from "#fail";
import type ViewResponse from "#frontend/ViewResponse";
import FileRef from "@rcompat/fs/FileRef";
import type Dict from "@rcompat/type/Dict";

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

  throw fail(`${error}${fix}`, view, pkgname);
}

/**
 * Render a view component using a frontend for the given filename extension
 * @param view path to view
 * @param props props for view
 * @param options rendering options
 * @return Response rendering function
 */
const view = (function viewResponse(name, props, options) {
  return (app, transfer, request) => extensions
    .map(extension => app.frontends[new FileRef(name)[extension]])
    .find(extension => extension !== undefined)
    ?.(name, props, options)(app, transfer, request)
    ?? no_frontend(name);
}) as ViewResponse;

export default view;
