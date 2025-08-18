import location from "#location";
import type ResponseFunction from "#response/ResponseFunction";
import Status from "@rcompat/http/Status";
import type ValidStatus from "@rcompat/http/ValidStatus";

type Options = {
  body?: string;
  page?: string;
  status?: ValidStatus;
};

/**
 * Render an error page
 * @param options rendering options
 * @param options.body HTML %body% replacement (default: "Not Found")
 * @param options.status Request status (default: 404 Not Found)
 * @param options.page HTML page to use (default: config.pages.error)
 * @return ResponseFunction response function
 */
export default (options?: Options): ResponseFunction =>
  app => app.view({
    body: options?.body ?? "Not Found",
    page: options?.page ?? location.error_html,
    status: options?.status ?? Status.NOT_FOUND,
  });
