import type ResponseFunction from "#response/ResponseFunction";
import type Actions from "@rcompat/http/Actions";

export default (actions: Actions): ResponseFunction => (app, _, request) =>
  app.upgrade(request.original, actions);
