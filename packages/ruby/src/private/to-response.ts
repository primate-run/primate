import HANDLER_PROPERTY from "#handler-property";
import response, {
  type ResponseFunction,
  type ResponseLike,
} from "@primate/core/response";
import type { Dict } from "@rcompat/type";

const { error, redirect, view } = response;

const handlers = { error, redirect, view };
type Handler = keyof typeof handlers;

type ViewParameters = Parameters<typeof view>;
type RedirectParameters = Parameters<typeof redirect>;
type ErrorParameters = Parameters<typeof error>;

const handle_handler = (handler: Handler, response: Dict) => {
  if (handler === "view") {
    const { name, options, props } = response as {
      name: ViewParameters[0];
      options: ViewParameters[2];
      props: ViewParameters[1];
    };
    return view(name, props, options);
  }
  if (handler === "redirect") {
    const { location, status } = response as {
      location: RedirectParameters[0];
      status: RedirectParameters[1];
    };
    return redirect(location, status);
  }

  const { options } = response as {
    options: ErrorParameters[0];
  };
  return error(options);
};

const is_handler = (handler: unknown): handler is Handler =>
  typeof handler === "string" && Object.keys(handlers).includes(handler);

export default (response: Dict): ResponseLike => {
  const handler = response[HANDLER_PROPERTY];

  return is_handler(handler)
    ? handle_handler(handler, response) as ResponseFunction
    : response;
};
