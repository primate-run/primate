import no_handler from "#error/no-handler";
import type Frontend from "#frontend/Frontend";
import FileRef from "@rcompat/fs/FileRef";

const extensions = ["extension", "fullExtension"] as const;

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
