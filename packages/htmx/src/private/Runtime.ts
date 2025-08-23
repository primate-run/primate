import FrontendModule from "@primate/core/frontend/Module";
import type ViewResponse from "@primate/core/frontend/ViewResponse";
import inline from "@primate/core/inline";
import response from "@primate/html/response";

export default class Runtime extends FrontendModule {
  name = "htmx";
  defaultExtensions = [".htmx"];
  layouts = false;
  client = false;
  respond: ViewResponse = (name, props, options = {}) => {
    return async (app, _, request) => {
      const code = "import { htmx } from \"app\";";
      const { head, integrity } = await inline(code, "module");
      const script_src = [integrity];

      return response(this)(name, props, {
        csp: { script_src },
        head,
        partial: Boolean(request.headers.try("hx-request")),
        ...options,
      })(app, _, request);
    };
  };
}
