import AppError from "#AppError";
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
};

function no_frontend(component: string) {
  const extension = new FileRef(component).fullExtension.slice(1);
  const hasPkg = extension in backmap;
  const error = "No frontend for {0}";
  const fix = hasPkg ? "" : ", did you configure {1}?";
  const pkgname = hasPkg ? "" : `@primate/${backmap[extension]}`;

  throw new AppError(`${error}${fix}`, component, pkgname);
}

/**
 * Render a component using a frontend for the given filename extension
 * @param component path to component
 * @param props props for component
 * @param options rendering options
 * @return Response rendering function
 */
const view = (function viewResponse(component, props, options) {
  return (app, transfer, request) => extensions
    .map(extension => app.frontends[new FileRef(component)[extension]])
    .find(extension => extension !== undefined)
    ?.(component, props, options)(app, transfer, request)
    ?? no_frontend(component);
}) as ViewResponse;

export default view;
