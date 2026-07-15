import location from "#location";
import type ResponseFunction from "#response/ResponseFunction";
import type { ValidStatus } from "@rcompat/http";
import http from "@rcompat/http";

type Options = {
  body?: string;
  template?: string;
  status?: ValidStatus;
};

const sse_reload = `<script>
  const live_reload = new EventSource("/esbuild");
  const close_live_reload = () => live_reload.close();
  addEventListener("pagehide", close_live_reload);
  addEventListener("beforeunload", close_live_reload);
  live_reload.addEventListener("change", () => {
    close_live_reload();
    location.reload();
  });
</script>`;

/**
 * Render an error page.
 *
 * @param options.body HTML `%body%` replacement (default: `"Not Found"`).
 * @param options.status Request status (default: `404 Not Found`).
 * @param options.template HTML template to use (default: `error.html`).
 * @return Response function.
 */
export default function error(options?: Options): ResponseFunction<never> {
  return app => app.view({
    body: options?.body ?? "Not Found",
    head: app.mode === "development" ? sse_reload : undefined,
    template: options?.template ?? location.error_html,
    status: options?.status ?? http.Status.NOT_FOUND,
  });
}
