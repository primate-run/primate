import type ResponseFunction from "#ResponseFunction";
import type Actions from "@rcompat/http/Actions";

export default (actions: Actions): ResponseFunction => (app, _, { request }) => 
  app.server().upgrade(request, actions);