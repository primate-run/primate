import error from "@primate/core/response/error";
import redirect from "@primate/core/response/redirect";
import type ResponseFunction from "@primate/core/response/ResponseFunction";
import type ResponseLike from "@primate/core/response/ResponseLike";
import view from "@primate/core/response/view";
import type Dict from "@rcompat/type/Dict";

type Handler = "error" | "redirect" | "view";

const parse = (input: null | string) =>
  input === null ? undefined : JSON.parse(input);

const handle_handler = (handler: Handler, response: Dict) => {
  if (handler === "view") {
    const { component, options, props } = response as {
      component: string;
      options: null | string;
      props: null | string;
    };
    return view(component, parse(props), parse(options));
  }
  if (handler === "redirect") {
    const { location, status } = response as {
      location: string;
      // unchecked, go is int
      status: null | Parameters<typeof redirect>[1];
    };
    return redirect(location, status === null ? undefined : status);
  }

  const { options } = response as {
    options: null | string;
  };
  return error(parse(options));
};

type ResponseType = (() => { handler: Handler } & Dict) | string;

export default (response: ResponseType): ResponseLike => {
  if (typeof response === "function") {
    const { handler, ...args } = response();
    return handle_handler(handler as Handler, args) as ResponseFunction;
  }
  return JSON.parse(response);
};
