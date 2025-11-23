import fail from "@primate/core/fail";
import FrontendModule from "@primate/core/frontend/Module";
import type ViewResponse from "@primate/core/frontend/ViewResponse";
import response from "@primate/html/response";

export default class Runtime extends FrontendModule {
  name = "htmx";
  defaultExtensions = [".htmx"];
  layouts = false;
  client = false;
  respond: ViewResponse = (name, props, options = {}) => {
    return async (app, _, request) => {
      const app_js = app.assets.find(asset =>
        asset.src?.includes("app") && asset.src.endsWith(".js"),
      );
      if (!app_js) throw fail("Could not find app.js in assets");

      const script = `<script type="module" src="${app_js.src}"></script>`;

      return response(this)(name, props, {
        head: script,
        partial: Boolean(request.headers.try("hx-request")),
        ...options,
      })(app, _, request);
    };
  };
}
