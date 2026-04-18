import type { ResponseLike } from "@primate/core";
import response from "@primate/core/response";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";

const { error, redirect, view } = response;

const handlers = { error, redirect, view };
type Handler = keyof typeof handlers;

const is_handler = (handler: unknown): handler is Handler =>
  typeof handler === "string" && Object.keys(handlers).includes(handler);

function to_response(args: Dict | string): ResponseLike {
  if (is.string(args)) {
    try {
      args = JSON.parse(args);
    } catch {
      return args;
    }
  }

  if (is.dict(args)) {
    const handler = args.handler;

    if (is_handler(handler)) {
      if (handler === "view") {
        const { component, props, options } = args as any;
        return view(
          component,
          props ? JSON.parse(props) : {},
          options ? JSON.parse(options) : {},
        );
      }

      if (handler === "redirect") {
        const { location, status } = args as any;
        return redirect(location, status);
      }

      const { options } = args as any;
      return error(options ? JSON.parse(options) : {});
    }
  }

  return args;
};

export default to_response;
