import type Component from "#frontend/Component";
import type RequestFacade from "#RequestFacade";
import type ServeApp from "#ServeApp";
import type Dictionary from "@rcompat/type/Dictionary";
import type MaybePromise from "@rcompat/type/MaybePromise";

type ResponseFunction =
  (app: ServeApp, transfer: Dictionary, request: RequestFacade)
  => MaybePromise<Component | Response | undefined | null>;

export { ResponseFunction as default };
