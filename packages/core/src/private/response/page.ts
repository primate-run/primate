import type ViewOptions from "#client/ViewOptions";
import E from "#errors";
import type ResponseFunction from "#response/ResponseFunction";
import response_view from "#response/view";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";

function page<Props extends Dict>(
  props?: Props,
  options?: ViewOptions,
): ResponseFunction<Props> {
  return (app, transfer, request) => {
    if (!is.string(transfer.route)) throw E.response_page_context_missing();

    return response_view(app.page(transfer.route), props, options)(
      app,
      transfer,
      request,
    );
  };
}

export default page;
