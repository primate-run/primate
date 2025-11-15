import error from "@primate/core/response/error";
import redirect from "@primate/core/response/redirect";
import type ResponseLike from "@primate/core/response/ResponseLike";
import view from "@primate/core/response/view";

const handlers = { error, redirect, view };
type Handler = keyof typeof handlers;

const is_handler = (handler: unknown): handler is Handler =>
  typeof handler === "string" && Object.keys(handlers).includes(handler);

export default (response: any): ResponseLike => {
  if (typeof response === "string") {
    try {
      response = JSON.parse(response);
    } catch {
      return response;
    }
  }

  if (response && typeof response === "object") {
    const handler = response.handler;

    if (is_handler(handler)) {
      if (handler === "view") {
        const { component, props, options } = response;
        return view(
          component,
          props ? JSON.parse(props) : {},
          options ? JSON.parse(options) : {},
        );
      }

      if (handler === "redirect") {
        const { location, status } = response;
        return redirect(location, status);
      }

      const { options } = response;
      return error(options ? JSON.parse(options) : {});
    }
  }

  return response;
};
